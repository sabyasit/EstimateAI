import { Component, OnInit } from '@angular/core';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
 
  title = 'EstimateAI';

  async ngOnInit() {
    // const model: any = await tf.loadLayersModel('assets/complexity/model.json');
    // const inputTensor = tf.tensor([[20,40,5,20,5]]);
    // const mean = tf.tensor([12.491493383742911,
    //   33.10018903591683,
    //   3.5954631379962194,
    //   14.984877126654064,
    //   3.55765595463138]); // Example means
    // const std = tf.tensor([4.426294460034448,
    //   5.807187056945897,
    //   0.6614258407267434,
    //   3.6402182720378105,
    //   0.7710394787895533]); // Example standard deviations
    // const scaledInput = inputTensor.sub(mean).div(std);

    // const prediction = await model.predict(scaledInput).array();
    // const predictedClassIndex = prediction[0].indexOf(Math.max(...prediction[0]));
    // const weatherLabels = ['Complex', 'Medium', 'MediumComplex', 'Simple', 'SimpleMedium', 'VerySimple'];
    // const predictedWeather = weatherLabels[predictedClassIndex];
    // console.log(predictedWeather);
  }

}
