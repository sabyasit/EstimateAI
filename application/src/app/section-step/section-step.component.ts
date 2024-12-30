import { Component, ViewChild, OnInit, ElementRef, AfterViewInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Drawflow from 'drawflow';

@Component({
	selector: 'app-section-step-modal',
	templateUrl: './section-step.component.html',
	styleUrls: ['./section-step.component.scss']
})
export class SectionStepModalComponent implements OnInit {
	@ViewChild('drawflow', { static: true }) drawflowEl!: ElementRef;
	editor!: Drawflow;

	constructor(public dialogRef: MatDialogRef<SectionStepModalComponent>,
		@Inject(MAT_DIALOG_DATA) public model: any
	) {}

	ngOnInit(): void {
		this.editor = new Drawflow(this.drawflowEl.nativeElement);
		this.editor.reroute = true;
		this.editor.curvature = .5;
		this.editor.reroute_fix_curvature = true;
		this.editor.reroute_curvature = 0.5;
		this.editor.force_first_input = false;
		this.editor.line_path = 1;
		this.editor.editor_mode = 'edit';

		this.editor.start();

		if(this.model) {
			setTimeout(() => {
				this.editor.import(this.model);
			}, 300);
		} else {
			this.addNodes();
		}
	}

	addNodes() {
		const startNode = this.editor.addNode('start', 0, 1, 10, 10, 'start', {}, 'Image', false);
		const exposureNode = this.createExposureNode();
		const grayStyleNode = this.createGrayStyleNode();
		const thresholdNode = this.createThresholdNode();
		const blurNode = this.createblurNode();
		const dilationNode = this.createDilationNode();
		const cannyNode = this.createCannyNode();
		const endNode = this.editor.addNode('end', 1, 0, 1330, 335, 'end', {}, 'Coordinates', false);

		setTimeout(() => {
			this.editor.addConnection(startNode, exposureNode, 'output_1', 'input_1');
			this.editor.addConnection(exposureNode, grayStyleNode, 'output_1', 'input_1');
			this.editor.addConnection(grayStyleNode, thresholdNode, 'output_1', 'input_1');
			this.editor.addConnection(thresholdNode, blurNode, 'output_1', 'input_1');
			this.editor.addConnection(blurNode, dilationNode, 'output_1', 'input_1');
			this.editor.addConnection(dilationNode, cannyNode, 'output_1', 'input_1');
			this.editor.addConnection(cannyNode, endNode, 'output_1', 'input_1');
		}, 500);
	}

	createExposureNode(preFix: string = '', x: number = 150, y: number = 55) {
		return this.editor.addNode(`exposure${preFix}`, 1, 1, x, y, 'exposure', { gamma: '5' },
			`<div class='header'>Exposure</div>
			<div class='body'>
				<div class='label'>Gamma</div>
				<input type="number" df-gamma min="0" max="10">
			</div>`,
			false);
	}

	createGrayStyleNode(preFix: string = '', x: number = 350, y: number = 63) {
		return this.editor.addNode(`grayStyle${preFix}`, 1, 1, x, y, 'grayStyle', {}, 'Gray Scaled', false);
	}

	createThresholdNode(preFix: string = '', x: number = 495, y: number = 135) {
		return this.editor.addNode(`threshold${preFix}`, 1, 1, x, y, 'threshold', { value: '253' },
			`<div class='header'>Threshold</div>
			<div class='body'>
				<div class='label'>Value</div>
				<input type="number" df-value min="0" max="255">
			</div>`,
			false);
	}

	createblurNode(preFix: string = '', x: number = 695, y: number = 30) {
		return this.editor.addNode(`blur${preFix}`, 1, 1, x, y, 'blur', { kernel: '3' },
			`<div class='header'>Gaussian Blur</div>
			<div class='body'>
				<div class='label'>Kernel size</div>
				<input type="number" df-kernel min="0" max="13">
			</div>`,
			false);
	}

	createDilationNode(preFix: string = '', x: number = 885, y: number = 120) {
		return this.editor.addNode(`dilation${preFix}`, 1, 1, x, y, 'dilation', { element: '1', kernel: '3' },
			`<div class='header'>Dilation</div>
			<div class='body'>
				<div class='label'>Element</div>
				<select df-element>
					<option value='1' selected>Rectangle</option>
					<option value='2'>Cross</option>
					<option value='3'>Ellipse</option>
				</select>
			</div>
			<div class='body'>
				<div class='label'>Kernel size</div>
				<input type="number" df-kernel min="0" max="13">
			</div>`,
			false);
	}

	createCannyNode(preFix: string = '', x: number = 1100, y: number = 220) {
		return this.editor.addNode(`canny${preFix}`, 1, 1, x, y, 'canny', { maxThreshold: '150', minThreshold: '50', aperture: '3' },
			`<div class='header'>Canny Edge</div>
			<div class='body'>
				<div class='label'>Max Threshold</div>
				<input type="number" df-maxThreshold min="0" max="13">
			</div>
			<div class='body'>
				<div class='label'>Min Threshold</div>
				<input type="number" df-minThreshold min="0" max="13">
			</div>
			<div class='body'>
				<div class='label'>Aperture</div>
				<input type="number" df-aperture min="0" max="5">
			</div>`,
			false);
	}

	addCustomNode(type: string) {

	}

	onStart() {
		const nodeId = 1;
		const flow = this.editor.export();
		const nodes = flow.drawflow.Home.data;

		if (!nodes[nodeId]) {
			console.error(`Node with ID ${nodeId} does not exist.`);
			return;
		}

		const connectedNodes: any[] = [];
		const traverseConnections = (currentNodeId: number) => {
			const node = nodes[currentNodeId];
			if (!node) return;

			for (const output in node.outputs) {
				const connections = node.outputs[output].connections;
				connections.forEach((connection: any) => {
					const connectedNodeId = parseInt(connection.node, 10);
					if (!connectedNodes.includes(connectedNodeId)) {
						connectedNodes.push(connectedNodeId);
						traverseConnections(connectedNodeId); // Recursively find connections
					}
				});
			}
		};

		traverseConnections(nodeId);
		const connectedNodeDetails = connectedNodes.map((id) => {
			return { class: nodes[id].class, data: nodes[id].data }
		});
		this.dialogRef.close({ nodes: connectedNodeDetails, data: this.editor.export() });
	}
}	
