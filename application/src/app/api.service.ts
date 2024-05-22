import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    constructor(private http: HttpClient) { }

    getGPT4ImageClassification(image: string): Observable<any> {
        const url = '';
        const headers = new HttpHeaders({
            'api-key': ''
        });

        const payload = {
            "messages": [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "text",
                            "text": "You are an AI assistant that helps people find information."
                        }
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image
                            }
                        },
                        {
                            "type": "text",
                            "text": "The image is a screenshot of a website section. Classify the image with labels ['card', 'chart', 'form', 'menu', 'search box' ,'table' ]. If label not match pass 'other'. Output only the classify labels as array."
                        }
                    ]
                }
            ],
            "temperature": 0.7,
            "top_p": 0.95,
            "max_tokens": 800,
            "stream": false
        }

        //return this.http.post(url, payload, { headers: headers });
        return of(JSON.parse(`{"choices":[{"content_filter_results":{"hate":{"filtered":false,"severity":"safe"},"self_harm":{"filtered":false,"severity":"safe"},"sexual":{"filtered":false,"severity":"safe"},"violence":{"filtered":false,"severity":"safe"}},"finish_reason":"stop","index":0,"message":{"content":"['card', 'chart']","role":"assistant"}}],"created":1716264222,"id":"chatcmpl-9RB0woWY4Go6W3Qrp3uq1OkQ12T1D","model":"gpt-4","object":"chat.completion","prompt_filter_results":[{"prompt_index":0,"content_filter_results":{"hate":{"filtered":false,"severity":"safe"},"self_harm":{"filtered":false,"severity":"safe"},"sexual":{"filtered":false,"severity":"safe"},"violence":{"filtered":false,"severity":"safe"}}}],"usage":{"completion_tokens":6,"prompt_tokens":329,"total_tokens":335}}`));   
    }
}

