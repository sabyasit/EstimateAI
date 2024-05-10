import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { TrainModel } from './train.model';

@Injectable({
    providedIn: 'root'
})

export class ExportService {
    exportJson(model: TrainModel) {
        const a = document.createElement('a');
        const file = new Blob([sessionStorage.getItem('model')!], { type: 'text/plain' });
        a.href = URL.createObjectURL(file);
        a.download = `${model.projectName}.json`;
        a.click();
    }

    async exportExcel(model: TrainModel) {
        const workbook = new ExcelJS.Workbook();
        const estimationDefinitionsWS = workbook.addWorksheet('Estimation Definitions');
        estimationDefinitionsWS.columns = [
            { header: 'Complexity', key: 'complexity', width: 20 },
            { header: 'View (hr)', key: 'view', width: 20 },
            { header: 'Logic & Model (hr)', key: 'logic', width: 20 },
            { header: 'Service Integration (hr)', key: 'service', width: 25 }
        ];
        this.headerCellStyle(estimationDefinitionsWS, estimationDefinitionsWS.columns.length);

        model.master.views.forEach(item => {
            estimationDefinitionsWS.addRow({
                complexity: item.item,
                view: item.hr,
                logic: model.master.logics.find(x => x.item === item.item)?.hr,
                service: model.master.services.find(x => x.item === item.item)?.hr,
            })
        })
        this.cellRangeStyle(estimationDefinitionsWS, [2, model.master.views.length + 1], [1, 4]);

        const estimationWS = workbook.addWorksheet('Estimations');
        estimationWS.columns = [
            { header: 'Page', key: 'page', width: 20 },
            { header: 'Section', key: 'section', width: 20 },
            { header: 'Unit', key: 'unit', width: 10 },
            { header: 'View', key: 'view', width: 20 },
            { header: 'Service Integration', key: 'service', width: 20 },
            { header: 'Logic & Model', key: 'logic', width: 20 },
            { header: 'Total (ph)', key: 'total', width: 10 },
            { header: 'Unit Testing (ph)', key: 'ut', width: 20 },
            { header: 'Total (pd)', key: 'pd', width: 10 }
        ];
        this.headerCellStyle(estimationWS, estimationWS.columns.length);

        model.pages.forEach(page => {
            let devHr = 0;
            page.features.forEach((item) => {
                const view = model.master.views.find(x => x.item === item.view)!.hr;
                const service = model.master.services.find(x => x.item === item.service)!.hr;
                const logic = model.master.logics.find(x => x.item === item.logic)!.hr;
                devHr += (view + service + logic) * item.unit;
            });
            const unitTestHr = ((devHr * model.master.unitTestPer) / 100);
            const totalHr = devHr + unitTestHr;
            const totalPd = (totalHr / model.master.personHours);

            estimationWS.addRow({
                page: page.name,
                total: devHr,
                ut: unitTestHr,
                pd: totalPd
            })

            page.features.forEach((item) => {
                const view = model.master.views.find(x => x.item === item.view)!.hr;
                const service = model.master.services.find(x => x.item === item.service)!.hr;
                const logic = model.master.logics.find(x => x.item === item.logic)!.hr;
                devHr = (view + service + logic) * item.unit;

                const unitTestHr = ((devHr * model.master.unitTestPer) / 100);
                const totalHr = devHr + unitTestHr;
                const totalPd = (totalHr / model.master.personHours);

                estimationWS.addRow({
                    section: item.name,
                    unit: item.unit,
                    view: item.view,
                    service: item.service,
                    logic: item.logic,
                    total: devHr,
                    ut: unitTestHr,
                    pd: totalPd
                })
            });
        })

        let devHr = 0;
        model.pages.forEach((page) => {
            page.features.filter(x => x.complete).forEach((item) => {
                const view = model.master.views.find(x => x.item === item.view)!.hr;
                const service = model.master.services.find(x => x.item === item.service)!.hr;
                const logic = model.master.logics.find(x => x.item === item.logic)!.hr;

                devHr += (view + service + logic) * item.unit;
            });
        });

        const unitTestHr = ((devHr * model.master.unitTestPer) / 100);
        const totalHr = devHr + unitTestHr;
        const totalPd = (totalHr / model.master.personHours);

        estimationWS.addRow({
            page: 'Total',
            total: devHr,
            ut: unitTestHr,
            pd: totalPd
        })


        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `${model.projectName}.xlsx`);
    }

    headerCellStyle(ws: ExcelJS.Worksheet, range: number) {
        ws.getRow(1).font = { bold: true };
        for (let i = 1; i <= range; i++) {
            ws.getRow(1).getCell(i).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' },
                bgColor: { argb: 'FF0000FF' }
            };
            ws.getRow(1).getCell(i).border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        }
    }

    cellRangeStyle(ws: ExcelJS.Worksheet, row: Array<number>, column: Array<number>) {
        for (let r = row[0]; r <= row[1]; r++) {
            for (let c = column[0]; c <= column[1]; c++) {
                ws.getRow(r).getCell(c).border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        }
    }
}