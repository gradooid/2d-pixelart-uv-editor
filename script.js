const imageInputRef = document.querySelector('#image');
const previewCanvasRef = document.querySelector('#preview');
const colorCanvasRef = document.querySelector('#colorPreview');
const uvCanvasRef = document.querySelector('#uv');
const resizeFormRef = document.querySelector('#resizeForm');
const previewZoomInputRef = document.querySelector('#previewZoom');
const uvZoomInputRef = document.querySelector('#uvZoom');
const exportBtnRef = document.querySelector('#export');

/**
 * @type {CanvasRenderingContext2D}
 */
const colorCtx = colorCanvasRef.getContext('2d');

/**
 * @type {CanvasRenderingContext2D}
 */
const uvCtx = uvCanvasRef.getContext('2d');

/**
 * @type {CanvasRenderingContext2D}
 */
const previewCtx = previewCanvasRef.getContext('2d');

const sourceCanvas = document.createElement('canvas');
const sourceCtx = sourceCanvas.getContext('2d');

const uvGridCanvasRef = document.querySelector('#grid');
const uvGridCtx = uvGridCanvasRef.getContext('2d');

const previewGridCanvasRef = document.querySelector('#previewGrid');
const previewGridCtx = previewGridCanvasRef.getContext('2d');

let selectedUV = [0, 0];
let selectedColor = [0, 0, 0, 0];
let previewZoom = 1;
let uvZoom = 1;
let imageRef = new Image();

const createGridDrawer = (ctx, targetCanvas) => () => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (let x = 0; x < targetCanvas.width; x++) {
    for (let y = 0; y < targetCanvas.height; y++) {
      const xN = (x / targetCanvas.width) * ctx.canvas.width;
      const yN = (y / targetCanvas.height) * ctx.canvas.height;

      ctx.strokeStyle = '#3F334D';
      ctx.strokeRect(
        xN,
        yN,
        ctx.canvas.width / targetCanvas.width,
        ctx.canvas.height / targetCanvas.height
      );
    }
  }
};

const drawUVGrid = createGridDrawer(uvGridCtx, uvCanvasRef);
const drawPreviewGrid = createGridDrawer(previewGridCtx, previewCanvasRef);

function changePreviewZoom(value) {
  previewZoom = value;
  previewCtx.canvas.style.width = `${imageRef.naturalWidth * previewZoom}px`;
  previewCtx.canvas.style.height = `${imageRef.naturalHeight * previewZoom}px`;
  previewGridCanvasRef.width = imageRef.naturalWidth * previewZoom;
  previewGridCanvasRef.height = imageRef.naturalHeight * previewZoom;
  drawPreviewGrid();
}

function changeUVZoom(value) {
  uvZoom = value;
  uvCtx.canvas.style.width = `${uvCanvasRef.width * uvZoom}px`;
  uvCtx.canvas.style.height = `${uvCanvasRef.height * uvZoom}px`;
  uvGridCanvasRef.width = uvCanvasRef.width * uvZoom;
  uvGridCanvasRef.height = uvCanvasRef.height * uvZoom;
  drawUVGrid();
}

exportBtnRef.onclick = () => {
  const imgUrl = sourceCanvas.toDataURL('image/png');
  console.log(imgUrl);
  const imgRef = document.createElement('img');
  imgRef.src = imgUrl;
  document.body.appendChild(imgRef);
};

resizeFormRef.onsubmit = (e) => {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);
  const width = +formData.get('width');
  const height = +formData.get('height');
  uvCanvasRef.width = width;
  uvCanvasRef.height = height;
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  uvGridCanvasRef.width = width;
  uvGridCanvasRef.height = height;
  changePreviewZoom(previewZoom);
  drawUVGrid();
};

previewZoomInputRef.oninput = (e) => {
  changePreviewZoom(+e.currentTarget.value);
};

uvZoomInputRef.oninput = (e) => {
  changeUVZoom(+e.currentTarget.value);
};

imageInputRef.onchange = (e) => {
  const file = e.currentTarget.files[0];
  const url = URL.createObjectURL(file);
  imageRef.src = url;
  imageRef.onload = () => {
    const width = imageRef.naturalWidth;
    const height = imageRef.naturalHeight;

    changePreviewZoom(previewZoom);

    previewCtx.mozImageSmoothingEnabled = false;
    previewCtx.webkitImageSmoothingEnabled = false;
    previewCtx.msImageSmoothingEnabled = false;
    previewCtx.imageSmoothingEnabled = false;

    previewCtx.canvas.width = width;
    previewCtx.canvas.height = height;
    previewCtx.drawImage(imageRef, 0, 0, width, height);

    selectedColor = previewCtx.getImageData(0, 0, 1, 1).data;
    previewColor(selectedColor);
    uvCtx.fillStyle = `rgba(${selectedColor.join(', ')})`;
    uvCtx.fillRect(0, 0, uvCtx.canvas.width, uvCtx.canvas.height);
  };
};

previewCanvasRef.onclick = (e) => {
  const { x: mouseX, y: mouseY } = e;
  const { width, height } = previewCanvasRef;
  const rect = e.currentTarget.getBoundingClientRect();

  const x = (mouseX - rect.left) / previewCanvasRef.clientWidth;
  const y = (mouseY - rect.top) / previewCanvasRef.clientHeight;

  const u = Math.floor(x * width) / width;
  const v = Math.floor(y * height) / height;
  selectedUV = [u, v];
  selectedColor = previewCtx.getImageData(
    Math.floor(x * width),
    Math.floor(y * height),
    1,
    1
  ).data;
  previewColor(selectedColor);
};

uvCanvasRef.onclick = (e) => {
  const { x: mouseX, y: mouseY } = e;
  const { width, height } = e.currentTarget;
  const rect = e.currentTarget.getBoundingClientRect();

  const x = (mouseX - rect.left) / uvCanvasRef.clientWidth;
  const y = (mouseY - rect.top) / uvCanvasRef.clientHeight;
  drawUVPixel(x * width, y * height);
};

function previewColor(color) {
  colorCtx.clearRect(0, 0, colorCtx.canvas.width, colorCtx.canvas.height);
  colorCtx.fillStyle = `rgba(${color.join(', ')})`;
  colorCtx.fillRect(0, 0, colorCtx.canvas.width, colorCtx.canvas.height);
}

function drawUVPixel(x, y) {
  const uvColor = [
    Math.round(selectedUV[0] * 255),
    Math.round(selectedUV[1] * 255),
    0,
    255,
  ];
  uvCtx.fillStyle = `rgba(${selectedColor.join(', ')})`;
  uvCtx.fillRect(Math.floor(x), Math.floor(y), 1, 1);

  sourceCtx.fillStyle = `rgba(${uvColor.join(', ')})`;
  sourceCtx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
}
