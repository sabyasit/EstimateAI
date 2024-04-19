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
            complete: boolean,
            image?: any,
            data?: string
        }>
    }>,
    prediction: {
        [key: string] : {
            view: string,
            service: string,
            logic: string
        }
    }
}

export interface ProcessDetails {
    display: boolean,
    text: string,
    value: any,
    data: any
}