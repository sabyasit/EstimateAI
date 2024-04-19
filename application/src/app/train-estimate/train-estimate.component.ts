import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import OpenLayerMap from 'ol/Map'
import ImageLayer from 'ol/layer/Image';
import { Vector as VectorLayer } from 'ol/layer.js';
import StaticImage from 'ol/source/ImageStatic';
import View from 'ol/View';
import Draw, { createBox } from 'ol/interaction/Draw.js';
import { Modify, Snap } from 'ol/interaction.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Polygon } from 'ol/geom'
import { Feature, Overlay } from 'ol';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import Projection from 'ol/proj/Projection';

import Transform from 'ol-ext/interaction/Transform';

import { ProcessDetails, TrainModel } from '../train.model';
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
  transform!: Transform;
  currentPageIndex: number = 0;
  drawEditMode: number = 1;
  processDetailsImage!: ProcessDetails;
  processPredectionImage!: ProcessDetails;

  constructor(public dialog: MatDialog, private imageWorkerService: ImageWorkerService) { }

  ngOnInit(): void {
    this.model = JSON.parse(sessionStorage.getItem('model')!);
    this.renderPage(0);
  }

  renderPage(index: number) {
    this.currentPageIndex = index;
    this.drawEditMode = 1;

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

    this.transform = new Transform({
      enableRotatedTransform: false,
      rotate: false
    })

    this.transform.on("scaling", (event: any) => {
      this.map.getOverlayById(event.feature.getId())?.setPosition(event.feature.getGeometry().getCoordinates()[0].reduce((acc: any, val: any) => acc[1] > val[1] ? acc : val));
    });

    this.transform.on("translating", (event: any) => {
      this.map.getOverlayById(event.feature.getId())?.setPosition(event.feature.getGeometry().getCoordinates()[0].reduce((acc: any, val: any) => acc[1] > val[1] ? acc : val));
    })

    this.transform.on("scaleend", (event: any) => {
      for (let i = 0; i < this.model.pages[this.currentPageIndex].features.length; i++) {
        if (this.model.pages[this.currentPageIndex].features[i].id === event.feature.getId()) {
          this.model.pages[this.currentPageIndex].features[i].coordinates = event.feature.getGeometry().getCoordinates();
          this.map.getOverlayById(event.feature.getId())?.setPosition(event.feature.getGeometry().getCoordinates()[0].reduce((acc: any, val: any) => acc[1] > val[1] ? acc : val));
        }
      }
      sessionStorage.setItem('model', JSON.stringify(this.model));
    });

    this.transform.on("translateend", (event: any) => {
      for (let i = 0; i < this.model.pages[this.currentPageIndex].features.length; i++) {
        if (this.model.pages[this.currentPageIndex].features[i].id === event.feature.getId()) {
          this.model.pages[this.currentPageIndex].features[i].coordinates = event.feature.getGeometry().getCoordinates();
          this.map.getOverlayById(event.feature.getId())?.setPosition(event.feature.getGeometry().getCoordinates()[0].reduce((acc: any, val: any) => acc[1] > val[1] ? acc : val));
        }
      }
      sessionStorage.setItem('model', JSON.stringify(this.model));
    })

    this.map.getView().fit(extent, this.map.getSize() as any);

    if (this.model.pages[index].features) {
      for (let i = 0; i < this.model.pages[index].features!.length; i++) {
        this.addFeature(this.model.pages[index].features[i].id,
          this.model.pages[index].features[i].coordinates,
          this.model.pages[index].features[i].color);
      }
    }

    this.draw.on('drawend', (event: any) => {
      this.openEstimateModal(false, null, event);
    });
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
        text: data.totalHr === 0 ? 'Not Estimated' : `${data.totalHr} Hrs | ${data.totalPd} Pd`,
        fill: new Fill({ color: '#000' }),
        stroke: new Stroke({ color: '#FFF', width: 3 }),
        font: 'bold 13px Tahoma'
      })
    }));
    feature.setId(id);
    (this.map.getAllLayers()[1].getSource() as any).addFeature(feature);

    this.addOverlay(feature);
  }

  addOverlay(feature: Feature) {
    const div = document.createElement('div');
    div.classList.add('overlay-settings');

    const span = document.createElement('span')
    span.innerHTML = 'settings';
    span.classList.add('material-icons');
    span.setAttribute('id', feature.getId()!.toString());
    span.addEventListener('click', (event: any) => {

    })
    div.appendChild(span);

    const ul = document.createElement('ul');
    const li_edit = document.createElement('li');
    li_edit.innerText = 'Edit';
    li_edit.setAttribute('id', feature.getId()!.toString());
    li_edit.addEventListener('click', (event: any) => {
      const value = this.model.pages[this.currentPageIndex].features.find(x => x.id === +event.target.id);
      this.openEstimateModal(true, value, null);
    })
    const li_delete = document.createElement('li');
    li_delete.innerText = 'Delete';
    li_delete.setAttribute('id', feature.getId()!.toString());
    li_delete.addEventListener('click', (event: any) => {
      this.deleteFeature(+event.target.id)
    })
    ul.appendChild(li_edit);
    ul.appendChild(li_delete);
    div.appendChild(ul);

    const overlay = new Overlay({
      element: div,
      autoPan: true,
      id: feature.getId(),
      positioning: 'top-right',
      position: (feature.getGeometry() as any).getCoordinates()[0].reduce((acc: any, val: any) => acc[1] > val[1] ? acc : val),
      offset: [60, 0]
    })

    this.map.addOverlay(overlay);
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

  changeDrawMode(mode: number) {
    this.drawEditMode = mode;

    if (this.drawEditMode === 1) {
      this.map.removeInteraction(this.transform);
      this.map.removeInteraction(this.draw);
    }

    if (this.drawEditMode === 2) {
      this.map.removeInteraction(this.transform);
      this.map.addInteraction(this.draw);
    }

    if (this.drawEditMode === 3) {
      this.map.addInteraction(this.transform);
      this.map.removeInteraction(this.draw);
    }
  }

  openEstimateModal(edit: boolean, data: any, event: any) {
    this.dialog.open(EstimateModalComponent, {
      data: { edit: edit, value: data },
      width: '400px',
      autoFocus: false,
      disableClose: true
    }).afterClosed().subscribe((value: any) => {
      if (!value) {
        return;
      }

      if (value.type === 'REMOVE') {
        (this.map.getAllLayers()[1].getSource() as any).removeFeature(event.feature);
        value.data.coordinates = event.feature.getGeometry().getCoordinates();
        value.data.complete = false;
        value.data.id = Date.now();
        this.model.pages[this.currentPageIndex].features.push(value.data);
        sessionStorage.setItem('model', JSON.stringify(this.model));
        this.addFeature(value.data.id, value.data.coordinates, value.data.color);
      }

      if (value.type === 'NEW') {
        (this.map.getAllLayers()[1].getSource() as any).removeFeature(event.feature);
        value.data.coordinates = event.feature.getGeometry().getCoordinates();
        value.data.complete = true;
        value.data.id = Date.now();
        this.model.pages[this.currentPageIndex].features.push(value.data);
        sessionStorage.setItem('model', JSON.stringify(this.model));
        this.addFeature(value.data.id, value.data.coordinates, value.data.color);
      }

      if (value.type === 'EDIT') {
        for (let i = 0; i < this.model.pages[this.currentPageIndex].features.length; i++) {
          if (this.model.pages[this.currentPageIndex].features[i].id === data.id) {
            this.model.pages[this.currentPageIndex].features[i].name = value.data.name;
            this.model.pages[this.currentPageIndex].features[i].unit = value.data.unit;
            this.model.pages[this.currentPageIndex].features[i].view = value.data.view;
            this.model.pages[this.currentPageIndex].features[i].service = value.data.service;
            this.model.pages[this.currentPageIndex].features[i].logic = value.data.logic;
            this.model.pages[this.currentPageIndex].features[i].color = value.data.color;
            this.model.pages[this.currentPageIndex].features[i].common = value.data.common;
            this.model.pages[this.currentPageIndex].features[i].complete = true;

            const estimates = this.calculatePageHrs(data.id);
            const feature: Feature = (this.map.getAllLayers()[1].getSource() as VectorSource).getFeatureById(data.id)!;
            (feature.getStyle() as any).getText().setText(`${estimates.totalHr} Hrs | ${estimates.totalPd} Pd`);
            (this.map.getAllLayers()[1].getSource() as VectorSource).changed();
          }
        }
        sessionStorage.setItem('model', JSON.stringify(this.model));
      }
    });
  }

  calculatePageHrs(id?: number) {
    let devHr = 0;
    if (id) {
      const feature = this.model.pages[this.currentPageIndex].features.find(x => x.id === id)!;
      if (feature.complete) {
        const view = this.model.master.views.find(x => x.item === feature.view)!.hr;
        const service = this.model.master.services.find(x => x.item === feature.service)!.hr;
        const logic = this.model.master.logics.find(x => x.item === feature.logic)!.hr;

        devHr = (view + service + logic) * feature.unit;
      }
    } else {
      this.model.pages[this.currentPageIndex].features.filter(x => x.complete).forEach((item) => {
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
      page.features.filter(x => x.complete).forEach((item) => {
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
      this.map.removeOverlay(this.map.getOverlayById(id)!);
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

  processImage() {
    this.imageWorkerService.initImage(this.model.pages[this.currentPageIndex].data, (data: ProcessDetails) => {
      this.processDetailsImage = data;
      if (this.processDetailsImage.display) {
        if (this.processDetailsImage.value != 95) {
          this.map.getAllLayers()[0].setSource(new StaticImage({
            url: this.processDetailsImage.data,
            imageExtent: [0, 0, this.model.pages[this.currentPageIndex].width, this.model.pages[this.currentPageIndex].height]
          }));
          this.map.getAllLayers()[0].getSource()?.refresh();
        } else {
          this.drawEdge(this.processDetailsImage.data)
        }
      }
    })
  }

  drawEdge(value: any) {
    let id = Date.now();

    const randomColor = Math.floor(Math.random() * 16777215).toString(16);

    const coordinates = [[
      [value.rect.x1, this.model.pages[this.currentPageIndex].height - value.rect.y1],
      [value.rect.x2, this.model.pages[this.currentPageIndex].height - value.rect.y1],

      [value.rect.x2, this.model.pages[this.currentPageIndex].height - value.rect.y2],
      [value.rect.x1, this.model.pages[this.currentPageIndex].height - value.rect.y2],

      [value.rect.x1, this.model.pages[this.currentPageIndex].height - value.rect.y1],
    ]];

    this.model.pages[this.currentPageIndex].features.push({
      color: `#${randomColor}`,
      common: false,
      id: id + value.index,
      logic: 'NA',
      name: `Item ${value.index}`,
      service: 'NA',
      unit: 1,
      view: 'Simple',
      coordinates: coordinates,
      complete: false
    });
    this.addFeature(id + value.index, coordinates, `#${randomColor}`);
    sessionStorage.setItem('model', JSON.stringify(this.model));
  }

  processPredection() {
    this.imageWorkerService.initPredection(this.model.pages[this.currentPageIndex].data,
      this.model.pages[this.currentPageIndex].features.filter(x => !x.complete)
        .map(x => { return { id: x.id, extent: (this.map.getAllLayers()[1].getSource() as VectorSource).getFeatureById(x.id)!.getGeometry()!.getExtent() } })
        .map(x => { return { id: x.id, value: [x.extent[0], this.model.pages[this.currentPageIndex].height - x.extent[3], x.extent[2] - x.extent[0], x.extent[3] - x.extent[1]] } }),
      (data: ProcessDetails) => {
        this.processPredectionImage = data;
        if (this.processPredectionImage.data) {
          this.model.pages[this.currentPageIndex].features.forEach(item => {
            if (item.id === this.processPredectionImage.data.id) {
              item.view = this.model.prediction[this.processPredectionImage.data.predictions[0].index].view;
              item.logic = this.model.prediction[this.processPredectionImage.data.predictions[0].index].logic;
              item.service = this.model.prediction[this.processPredectionImage.data.predictions[0].index].service;
              item.image = this.processPredectionImage.data.image;
              item.name = this.processPredectionImage.data.predictions[0].index;
              item.complete = true;
              item.data = JSON.stringify(this.processPredectionImage.data.predictions);

              const estimates = this.calculatePageHrs(item.id);
              const feature: Feature = (this.map.getAllLayers()[1].getSource() as VectorSource).getFeatureById(item.id)!;
              (feature.getStyle() as any).getText().setText(`${estimates.totalHr} Hrs | ${estimates.totalPd} Pd`);
              (this.map.getAllLayers()[1].getSource() as VectorSource).changed();
            }
          })
          //sessionStorage.setItem('model', JSON.stringify(this.model));
        }
      })
  }
}
