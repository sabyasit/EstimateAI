import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import OpenLayerMap from 'ol/Map'
import ImageLayer from 'ol/layer/Image';
import { Vector as VectorLayer } from 'ol/layer.js';
import StaticImage from 'ol/source/ImageStatic';
import View from 'ol/View';
import Draw, { createBox } from 'ol/interaction/Draw.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Polygon } from 'ol/geom'
import { Feature } from 'ol';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import { Pixel } from 'ol/pixel';
import Projection from 'ol/proj/Projection';
import { getCenter } from 'ol/extent';

import { TrainModel } from '../train.model';
import { EstimateModalComponent } from '../estimate-modal/estimate-modal.component';
import { MasterModalComponent } from '../master-modal/master-modal.component';

import { ImageWorkerService } from '../image-worker.service';

@Component({
  selector: 'app-train-estimate',
  templateUrl: './train-estimate.component.html',
  styleUrls: ['./train-estimate.component.scss']
})
export class TrainEstimateComponent implements OnInit {
  model!: TrainModel;
  map!: OpenLayerMap;
  draw!: Draw;
  currentPageIndex: number = 0;
  drawEditMode: boolean = true;
  processLoader = { display: false, text: 'Changing exposure...', value: 0 }

  constructor(public dialog: MatDialog, private imageWorkerService: ImageWorkerService) { }

  ngOnInit(): void {
    this.model = JSON.parse(sessionStorage.getItem('model')!);
    this.renderPage(0);
  }

  renderPage(index: number) {
    this.currentPageIndex = index;
    this.drawEditMode = true;

    if (this.map) {
      this.map.setTarget(undefined);
      this.map.dispose();
    }

    const extent = [0, 0, this.model.pages[index].width, this.model.pages[index].height];
    const projection = new Projection({
      code: 'xkcd-image',
      units: 'pixels',
      extent: extent,
    });

    const imageLayer = new ImageLayer({
      source: new StaticImage({
        url: this.model.pages[index].data,
        imageExtent: extent,
        projection: projection
      })
    })

    const view = new View({
      projection: projection,
      constrainOnlyCenter: true,
      // center: getCenter(extent),
      // zoom: this.getZoom(),
      // minZoom: this.getZoom(),
      padding: [10, 10, 10, 10]
    })

    const source = new VectorSource({ wrapX: false });

    const vector = new VectorLayer({
      source: source
    });

    this.map = new OpenLayerMap({
      controls: [],
      layers: [imageLayer, vector],
      target: document.getElementById('map') as any,
      view: view
    })

    this.draw = new Draw({
      source: source,
      type: 'Circle',
      geometryFunction: createBox(),
    });

    this.map.getView().fit(extent, this.map.getSize() as any);

    if (this.model.pages[index].features) {
      for (let i = 0; i < this.model.pages[index].features!.length; i++) {
        this.addFeature(this.model.pages[index].features[i].id,
          this.model.pages[index].features[i].coordinates,
          this.model.pages[index].features[i].color);
      }
    }

    this.draw.on('drawend' as any, (event: any) => {
      this.openEstimateModal(false, null, event);
    });

    this.map.on('pointermove', (event: any) => {
      if (!this.drawEditMode) {
        return;
      }

      this.map.forEachFeatureAtPixel(event.pixel, () => {
        document.body.style.cursor = 'pointer';
      }, { hitTolerance: 5 });

      if (!this.map.hasFeatureAtPixel(event.pixel)) {
        document.body.style.cursor = '';
      }
    })

    this.map.on('singleclick', (event: any) => {
      if (!this.drawEditMode) {
        return;
      }

      if (this.map.hasFeatureAtPixel(event.pixel)) {
        const feature = this.map.getFeaturesAtPixel(event.pixel);
        if (feature.length > 0) {
          const value = this.model.pages[this.currentPageIndex].features.find(x => x.id === feature[0].getId());
          if (value) {
            this.openEstimateModal(true, value, null)
          }
        }
      }
    })
  }

  addFeature(id: number, coordinates: any, color: string) {
    const data = this.calculatePageHrs(id);
    let feature: Feature = new Feature<Polygon>({
      geometry: new Polygon(coordinates)
    });
    feature.setStyle(new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 0, 0.2)',
      }),
      stroke: new Stroke({
        color: color,
        width: 2
      }),
      text: new Text({
        text: `${data.totalHr} Hrs | ${data.totalPd} Pd`,
        fill: new Fill({ color: '#000' }),
        stroke: new Stroke({ color: '#FFF', width: 3 }),
        font: 'bold 13px Tahoma'
      })
    }));
    feature.setId(id);
    (this.map.getAllLayers()[1].getSource() as any).addFeature(feature);
  }

  getZoom() {
    const elelment = document.getElementById('map') as any;
    const ar = elelment.clientHeight / elelment.clientWidth;
    const img = this.model.pages[this.currentPageIndex].height / this.model.pages[this.currentPageIndex].width;
    if (img > ar) {
      return Math.LOG2E * Math.log(elelment.clientHeight / 256)
    } else {
      return Math.LOG2E * Math.log(elelment.clientWidth / 256)
    }
  }

  changeDrawMode() {
    this.drawEditMode = !this.drawEditMode;
    if (!this.drawEditMode) {
      this.map.addInteraction(this.draw);
    } else {
      this.map.removeInteraction(this.draw);
    }
  }

  openEstimateModal(edit: boolean, data: any, event: any) {
    debugger;
    this.dialog.open(EstimateModalComponent, {
      data: { edit: edit, value: data },
      width: '400px',
      autoFocus: false,
      disableClose: true
    }).afterClosed().subscribe((value: any) => {
      if (!edit) {
        (this.map.getAllLayers()[1].getSource() as any).removeFeature(event.feature);
        if (value) {
          value.coordinates = event.feature.getGeometry().getCoordinates();
          value.id = Date.now();
          this.model.pages[this.currentPageIndex].features.push(value);
          sessionStorage.setItem('model', JSON.stringify(this.model));
          this.addFeature(value.id, value.coordinates, value.color);
        }
      } else {
        if (value) {
          for (let i = 0; i < this.model.pages[this.currentPageIndex].features.length; i++) {
            if (this.model.pages[this.currentPageIndex].features[i].id === data.id) {
              this.model.pages[this.currentPageIndex].features[i].name = value.name;
              this.model.pages[this.currentPageIndex].features[i].unit = value.unit;
              this.model.pages[this.currentPageIndex].features[i].view = value.view;
              this.model.pages[this.currentPageIndex].features[i].service = value.service;
              this.model.pages[this.currentPageIndex].features[i].logic = value.logic;
              this.model.pages[this.currentPageIndex].features[i].color = value.color;
              this.model.pages[this.currentPageIndex].features[i].common = value.common;
            }
          }
          sessionStorage.setItem('model', JSON.stringify(this.model));
        }
      }
    });
  }

  calculatePageHrs(id?: number) {
    let devHr = 0;
    if (id) {
      const feature = this.model.pages[this.currentPageIndex].features.find(x => x.id === id)!;
      const view = this.model.master.views.find(x => x.item === feature.view)!.hr;
      const service = this.model.master.services.find(x => x.item === feature.service)!.hr;
      const logic = this.model.master.logics.find(x => x.item === feature.logic)!.hr;

      devHr = (view + service + logic) * feature.unit;
    } else {
      this.model.pages[this.currentPageIndex].features.forEach((item) => {
        const view = this.model.master.views.find(x => x.item === item.view)!.hr;
        const service = this.model.master.services.find(x => x.item === item.service)!.hr;
        const logic = this.model.master.logics.find(x => x.item === item.logic)!.hr;

        devHr += (view + service + logic) * item.unit;
      });
    }
    const devPd = Math.ceil(devHr / this.model.master.personHours);
    const unitTestHr = Math.ceil((devHr * this.model.master.unitTestPer) / 100);
    const unitTestPd = Math.ceil(unitTestHr / this.model.master.personHours);
    const totalHr = devHr + unitTestHr;
    const totalPd = devPd + unitTestPd;

    return { devHr, devPd, unitTestHr, unitTestPd, totalHr, totalPd }
  }

  totalEstimate() {
    let devHr = 0;
    this.model.pages.forEach((page) => {
      page.features.forEach((item) => {
        const view = this.model.master.views.find(x => x.item === item.view)!.hr;
        const service = this.model.master.services.find(x => x.item === item.service)!.hr;
        const logic = this.model.master.logics.find(x => x.item === item.logic)!.hr;

        devHr += (view + service + logic) * item.unit;
      });
    });

    const devPd = Math.ceil(devHr / this.model.master.personHours);
    const unitTestHr = Math.ceil((devHr * this.model.master.unitTestPer) / 100);
    const unitTestPd = Math.ceil(unitTestHr / this.model.master.personHours);
    const totalHr = devHr + unitTestHr;
    const totalPd = devPd + unitTestPd;

    return { devHr, devPd, unitTestHr, unitTestPd, totalHr, totalPd }
  }

  onFocusToggleFeature(focus: boolean, id: number) {
    const feature = (this.map.getAllLayers()[1].getSource() as VectorSource).getFeatureById(id);
    if (feature) {
      (feature.getStyle() as Style).getStroke()?.setWidth(focus ? 5 : 2);
    }
    (this.map.getAllLayers()[1].getSource() as VectorSource).changed();
  }

  deleteFeature(id: number) {
    const feature = (this.map.getAllLayers()[1].getSource() as VectorSource).getFeatureById(id);
    if (feature) {
      (this.map.getAllLayers()[1].getSource() as VectorSource).removeFeature(feature);
      (this.map.getAllLayers()[1].getSource() as VectorSource).changed();

      const index = this.model.pages[this.currentPageIndex].features.findIndex(x => x.id === id);
      this.model.pages[this.currentPageIndex].features.splice(index, 1);

      sessionStorage.setItem('model', JSON.stringify(this.model));
    }
  }

  onPageNameChange() {
    sessionStorage.setItem('model', JSON.stringify(this.model));
  }

  onComplete() {
    this.model.pages[this.currentPageIndex].complete = true;
    sessionStorage.setItem('model', JSON.stringify(this.model));
  }

  onMasterModal() {
    this.dialog.open(MasterModalComponent, {
      data: this.model,
      width: '700px',
      autoFocus: false,
      disableClose: true
    }).afterClosed().subscribe(() => {
      sessionStorage.setItem('model', JSON.stringify(this.model));
    })
  }

  onDownload() {
    const a = document.createElement('a');
    const file = new Blob([sessionStorage.getItem('model')!], { type: 'text/plain' });
    a.href = URL.createObjectURL(file);
    a.download = `${this.model.projectName}.json`;
    a.click();
  }

  processAI() {
    this.processLoader.display = true;
    this.processLoader.text = 'Changing exposure...';
    this.processLoader.value = 0;

    this.imageWorkerService.onImage = (type: string, image: any, progress: number) => {
      this.processLoader.value = progress;
      this.processLoader.text = type;
      if (type != 'Drwaing edges...') {
        this.map.getAllLayers()[0].setSource(new StaticImage({
          url: image,
          imageExtent: [0, 0, this.model.pages[this.currentPageIndex].width, this.model.pages[this.currentPageIndex].height]
        }));
        this.map.getAllLayers()[0].getSource()?.refresh();
      } else {
        this.map.getAllLayers()[0].setSource(new StaticImage({
          url: this.model.pages[this.currentPageIndex].data,
          imageExtent: [0, 0, this.model.pages[this.currentPageIndex].width, this.model.pages[this.currentPageIndex].height]
        }));
        this.map.getAllLayers()[0].getSource()?.refresh();
        this.drawEdges(image);
        this.processLoader.display = false;
      }
    };
    this.imageWorkerService.init(this.model.pages[this.currentPageIndex].data);
  }

  drawEdges(rect: Array<any>) {
    let id = Date.now();

    for (let i = 0; i < rect.length; i++) {
      const randomColor = Math.floor(Math.random() * 16777215).toString(16);

      if (((rect[i][2].x - rect[i][0].x) * (rect[i][2].y - rect[i][0].y)) < 1000) continue;

      const coordinates = [[
        [rect[i][0].x, this.model.pages[this.currentPageIndex].height - rect[i][0].y],
        [rect[i][2].x, this.model.pages[this.currentPageIndex].height - rect[i][0].y],

        [rect[i][2].x, this.model.pages[this.currentPageIndex].height - rect[i][2].y],
        [rect[i][0].x, this.model.pages[this.currentPageIndex].height - rect[i][2].y],

        [rect[i][0].x, this.model.pages[this.currentPageIndex].height - rect[i][0].y],
      ]];

      this.model.pages[this.currentPageIndex].features.push({
        color: `#${randomColor}`,
        common: false,
        id: id + i,
        logic: "Simple",
        name: `Item ${i}`,
        service: "Simple CRUD",
        unit: 1,
        view: "Simple",
        coordinates: []
      });
      this.addFeature(id + i, coordinates, `#${randomColor}`);
    }
  }
}
