self.onmessage = (image) => {
    changeGrayStyle(image).then((img) => {
        self.postMessage(img);
    })
}

const changeGrayStyle = (image) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg; // Red
                data[i + 1] = avg; // Green
                data[i + 2] = avg; // Blue
            }
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'))
        };
        img.src = image.data;
    })
}

const changeBlur = () => {

}

const changeExposure = () => {

}

const edgeDetection = () => {

}