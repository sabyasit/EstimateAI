export interface TrainModel {
    master: {
        views: Array<{
            item: string,
            hr: number
        }>,
        services: Array<{
            item: string,
            hr: number
        }>,
        logics: Array<{
            item: string,
            hr: number
        }>,
        unitTestPer: number,
        personHours: number
    },
    projectName: string,
    pages: Array<{
        data: string,
        width: number,
        height: number,
        name: string,
        complete: boolean,
        features: Array<{
            coordinates: any,
            color: string,
            name: string,
            id: number,
            unit: number,
            view: string,
            service: string,
            logic: string,
            common: boolean,
            commonId?: number,
            complete: boolean,
            data?: string,
            image?: any,
            element?: Array<string>
        }>,
        imageNodes: any
    }>,
    prediction: {
        [key: string] : {
            view: string,
            service: string,
            logic: string,
            weightage: number,
            reusability: number
        }
    }
}

export interface ProcessDetails {
    display: boolean,
    text: string,
    value: any,
    data: any,
    image?: any
}