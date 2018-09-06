var visibleCanvas = document.getElementById('visibleCanvas');
var hiddenCanvas = document.getElementById('hiddenCanvas');

var data = {valeurComp: [], labelComp: []};

var template, etoile_doree, etoile_grise;

var csvData;
var csvImages;
var csvFond;
var csvLogo;

var mode = "normal";

var inputFields = [
    'whiteText',
    'textShadow',
    'name',
    'surname',
    'citation',
    'rarete',
    'image',
    'fond',
    'logo',
]

for(var i=0;i<inputFields.length;i++){
    setListener(inputFields[i]);
}

for(var i=0;i<6;i++){
	setValeurCompListener(i);
	setLabelCompListener(i);
}

var radios = document.getElementsByName('mode');
for (var i = 0, length = radios.length; i < length; i++){
    setModeRadioButtonListener(radios[i]);
}

showModeTable();

setCsvListeners();

loadStaticImages().then(() => {
    randomize();
    renderImage(visibleCanvas, data);
    renderImage(hiddenCanvas, data);
});

document.getElementById('csv').addEventListener('change', function() {
    Papa.parse(this.files[0], {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            parseCsv(results.data)
        }
    });
});

function parseCsv(data){
    csvData = data;
    for(var i=0;i<csvData.length;i++){
        parseCsvComps(csvData[i]);
    }
}

function getImageFromData(curData, canvas){
    console.log(curData);
    console.log(canvas);
    retrieveCsvImage(curData);
    renderImage(canvas, curData);
    return canvas.toDataURL("image/png");
}

function massGenerate(){
    var margin = 8;
    var heightCards = (210 - 3 * margin) / 2;
    var widthCards = hiddenCanvas.width / hiddenCanvas.height * heightCards;
    var nbCardsRow = 4; // Math.floor((297 - 2 * margin) / (widthCards + margin));
    console.log(nbCardsRow);

    var images = [];
    for(var i=0;i<csvData.length;i++){
        retrieveCsvImage(csvData[i]);
        for(var j=0;j<csvData[i].nbExemplaires;j++){
            randomize();
            renderImage(hiddenCanvas, csvData[i]);
            var image = hiddenCanvas.toDataURL("image/png");
            images.push(image);
        }
    }
    
    var doc = new jsPDF('landscape');
    for(var i=0;i<images.length;i++){
        if(i != 0 && i % (nbCardsRow * 2) == 0) {
            doc.addPage()
        }
        var xCard = (297 - nbCardsRow * widthCards - (nbCardsRow - 1) * margin) / 2 + (margin + widthCards) * (i % nbCardsRow);
        var yCard = (margin + (margin + heightCards) * Math.floor(i / nbCardsRow)) % (2 * (margin + heightCards));
        doc.addImage(images[i], 'PNG', xCard, yCard, widthCards, heightCards);
    }
    doc.save('a4.pdf');
    
    //download(hiddenCanvas);
}

function setModeRadioButtonListener(radioButton){
    radioButton.addEventListener('input', function() {
        mode = radioButton.value;
        showModeTable();
    });
}

function showModeTable(){
    document.getElementById('csvMode').style.display = mode == 'csv' ? 'block' : 'none';
    document.getElementById('normalMode').style.display = mode == 'normal' ? 'block' : 'none';
}

function loadStaticImages(){
    return new Promise((resolve, reject) => {
        loadImages([
            "https://image.ibb.co/d65b7z/template2.png",
            "https://image.ibb.co/dyaLZe/etoile_doree.png",
            "https://image.ibb.co/dTguue/etoile_grise.png",
        ])
        .then((images) => {
            template = images[0];
            etoile_doree = images[1];
            etoile_grise = images[2];
            resolve();
        })
        .catch((e) => {
            alert(e);
        });
    });
}

function loadImages(images){
    var promises = [];
    for(var i=0;i<images.length;i++){
        promises.push(loadImage(images[i]));
    }

    return Promise.all(promises);
}

function parseCsvComps(curData){
    curData.valeurComp = [];
    curData.labelComp = [];
    for(var i=0;i<6;i++){
        curData.valeurComp.push(curData['valeurComp'+(i+1)]);
        delete curData['valeurComp'+(i+1)];
        curData.labelComp.push(curData['labelComp'+(i+1)]);
        delete curData['labelComp'+(i+1)];
    }
}

function setCsvListeners(){
    setCsvFondListener();
    setCsvLogoListener();
    setCsvImagesListeners();
}

function setCsvFondListener(){
    document.getElementById("csvFond").addEventListener('change', function(e) {
        var img = new Image;
        img.onload = function() {
            csvFond = img;
        }
        img.src = URL.createObjectURL(e.target.files[0]);
    });
}

function setCsvLogoListener(){
    document.getElementById("csvLogo").addEventListener('change', function(e) {
        var img = new Image;
        img.onload = function() {
            csvLogo = img;
        }
        img.src = URL.createObjectURL(e.target.files[0]);
    });
}

function setCsvImagesListeners(){
    document.getElementById("csvImages").addEventListener('change', function(e) {
        csvImages = {};
        for(var i=0;i<e.target.files.length;i++){
            setCsvImageListener(e.target.files[i].name, e.target.files[i]);
        }
    });
}

function setCsvImageListener(name, file){
    var img = new Image;
    img.onload = function() {
        csvImages[name] = img;
    }
    img.src = URL.createObjectURL(file);
}

function retrieveCsvImage(curData){
    curData.image = csvImages[curData.image];
    curData.fond = csvFond;
    curData.logo = csvLogo;
}

function setListener(propertyName){
    if(document.getElementById(propertyName).type == 'checkbox') {
        document.getElementById(propertyName).addEventListener('change', function() {
            data[propertyName] = document.getElementById(propertyName).checked;
            renderImage(visibleCanvas, data);
        });
    } else if(document.getElementById(propertyName).type == 'file') {
        document.getElementById(propertyName).addEventListener('change', function(e) {
            var img = new Image;
            img.onload = function() {
                data[propertyName] = img;
                renderImage(visibleCanvas, data);
            }
            img.src = URL.createObjectURL(e.target.files[0]);
        });
    } else if(document.getElementById(propertyName).type == 'text' || document.getElementById(propertyName).type == 'textarea' || document.getElementById(propertyName).type == 'number') {
        document.getElementById(propertyName).addEventListener('input', function() {
            data[propertyName] = document.getElementById(propertyName).value;
            renderImage(visibleCanvas, data);
        });
    }
}

function download(canvas){
    setHref(canvas);
    var downloadButton = document.getElementById("download");
    downloadButton.click();
}

function setHref(canvas){
    if(!canvas)
        canvas = visibleCanvas;
    var downloadButton = document.getElementById("download");
    var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    downloadButton.setAttribute("href", image);
}

function setValeurCompListener(i){
  document.getElementById('valeurComp'+i).addEventListener('input', function() {
      data.valeurComp[i] = document.getElementById('valeurComp'+i).value;
      renderImage(visibleCanvas, data);
  });
}

function setLabelCompListener(i){
  document.getElementById('labelComp'+i).addEventListener('input', function() {
      data.labelComp[i] = document.getElementById('labelComp'+i).value;
      renderImage(visibleCanvas, data);
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    ctx.textAlign="center"; 

    for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = ctx.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
}

function randomize(){
    var pos = [];
    for(var i=0;i<6;i++)
        pos.push(i);
    data.pos = shuffle(pos);
    data.posUpperMark = Math.floor(Math.random() * 6);
}

function randomizeButton(){
    randomize();
    renderImage(visibleCanvas, data);
}

function makeCombatMarks(ctx){
    var colors = ['#00aeef', '#fff200', '#ed1c24', '#fff', '#8dc63f', '#f7941d'];
    
    var margin = 13;
    var widthMark = 99;
    var heightMark = 13;
    var yPosMarks = 864;

    for(var i=0;i<6;i++){
        ctx.fillStyle = colors[data.pos[i]];
        ctx.beginPath();
        ctx.rect(margin + i * widthMark, yPosMarks, widthMark, heightMark);
        ctx.fill();
    }

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.rect(margin + data.posUpperMark * widthMark, 0, widthMark, heightMark);
    ctx.fill();
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function drawEtoiles(ctx, rarete){
    var etoilesX = 75;
    var etoilesFirstY = 357;
    var etoilesSpacing = 54;

    for(var i=0;i<5;i++){
        var etoile = i < rarete ? etoile_doree : etoile_grise;
        ctx.drawImage(etoile, etoilesX, etoilesFirstY - i * etoilesSpacing);
    }
}

function loadImage(url) {
  return new Promise((fulfill, reject) => {
    let imageObj = new Image();
    imageObj.crossOrigin = "Anonymous";
    imageObj.onload = () => fulfill(imageObj);
    imageObj.src = url;
  });
}

function renderImage(canvas, data){
    var ctx = canvas.getContext('2d');

    canvas.width = template.width;
    canvas.height = template.height;
    canvas.style.width  = canvas.width/2;
    canvas.style.height = canvas.height/2;

    if(data.fond)
        ctx.drawImage(data.fond, 0, 0, canvas.width, canvas.height);
    else{
        ctx.fillStyle = "#fa00ff";
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fill();
    }

    if(data.image)
        ctx.drawImage(data.image, 137, 131, 435, 277);
    
    ctx.drawImage(template, 0, 0);
    ctx.fillStyle = '#000';
    ctx.textAlign = "center";
    ctx.textBaseline="middle"; 
    
    ctx.font = '30px sans-serif';
    ctx.fillText(data.name ? data.name : "", 275, 70);
    
    ctx.font = '20px sans-serif';
    ctx.fillText(data.surname ? data.surname : "", 275, 103);

    if(data.whiteText)
        ctx.fillStyle = '#fff';
    else
        ctx.fillStyle = '#000';
    if(data.textShadow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "black";
    }
    wrapText(ctx, data.citation ? '«' + data.citation + '»' : "", canvas.width / 2, 700, canvas.width - 100, 22);
    ctx.shadowBlur = 0;
    
    var xFirstColumnComp = 81;
    var xSecondColumnComp = 327;
    var yFirstRowComp = 478;
    var rowSpacingComp = 80;
    
    var offsetX = 45;
    var offsetY = 0;
    
    for(var i=0;i<6;i++){
        ctx.fillStyle = "#000";
        ctx.globalAlpha = 0.5;
        ctx.textAlign="center"; 
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText(data.valeurComp[i] || data.valeurComp[i] == 0 ? data.valeurComp[i] : "", i < 3 ? xFirstColumnComp : xSecondColumnComp, yFirstRowComp + rowSpacingComp * (i % 3));
        ctx.globalAlpha = 1;

        if(data.whiteText)
            ctx.fillStyle = '#fff';
        else
            ctx.fillStyle = '#000';
        if(data.textShadow) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = "black";
        }
        ctx.textAlign="left"; 
        ctx.font = '30px sans-serif';
        ctx.fillText(data.labelComp[i] ? data.labelComp[i] : "", (i < 3 ? xFirstColumnComp : xSecondColumnComp) + offsetX, yFirstRowComp + rowSpacingComp * (i % 3) + offsetY);
        ctx.shadowBlur = 0;
    }

    makeCombatMarks(ctx);
    drawEtoiles(ctx, data.rarete ? data.rarete : 1);

    if(data.logo)
        ctx.drawImage(data.logo, 502, 48, 70, 70);
}

