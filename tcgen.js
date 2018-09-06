var visibleCanvas = document.getElementById('visibleCanvas');
var hiddenCanvas = document.getElementById('hiddenCanvas');

var data = {valuesSkills: [], labelsSkills: []};

var template, goldenStar, greyStar;

var csvData;
var csvImages;
var csvBackground;
var csvLogo;

var mode = "normal";

var inputFields = [
    'whiteText',
    'textShadow',
    'name',
    'nickname',
    'quote',
    'rarity',
    'image',
    'background',
    'logo',
]

for(var i=0;i<inputFields.length;i++){
    setListener(inputFields[i]);
}

for(var i=0;i<6;i++){
	setValueSkillListener(i);
	setLabelSkillListener(i);
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

document.getElementById('csvFile').addEventListener('change', function() {
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
        parseCsvSkills(csvData[i]);
    }
}

function getImageFromData(curData, canvas){
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
            "https://image.ibb.co/mnRa5K/template.png",
            "https://image.ibb.co/dyaLZe/etoile_doree.png",
            "https://image.ibb.co/dTguue/etoile_grise.png",
        ])
        .then((images) => {
            template = images[0];
            goldenStar = images[1];
            greyStar = images[2];
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

function parseCsvSkills(curData){
    curData.valuesSkills = [];
    curData.labelsSkills = [];
    for(var i=0;i<6;i++){
        curData.valuesSkills.push(curData['valueSkill'+(i+1)]);
        delete curData['valueSkill'+(i+1)];
        curData.labelsSkills.push(curData['labelSkill'+(i+1)]);
        delete curData['labelSkill'+(i+1)];
    }
}

function setCsvListeners(){
    setCsvBackgroundListener();
    setCsvLogoListener();
    setCsvImagesListeners();
}

function setCsvBackgroundListener(){
    document.getElementById("csvBackground").addEventListener('change', function(e) {
        var img = new Image;
        img.onload = function() {
            csvBackground = img;
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
    curData.background = csvBackground;
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

function setValueSkillListener(i){
  document.getElementById('valueSkill'+i).addEventListener('input', function() {
      data.valuesSkills[i] = document.getElementById('valueSkill'+i).value;
      renderImage(visibleCanvas, data);
  });
}

function setLabelSkillListener(i){
  document.getElementById('labelSkill'+i).addEventListener('input', function() {
      data.labelsSkills[i] = document.getElementById('labelSkill'+i).value;
      renderImage(visibleCanvas, data);
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, textAlign) {
    var words = text.split(' ');
    var line = '';
    ctx.textAlign = textAlign; 

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

function drawStars(ctx, rarity){
    var starsX = 75;
    var starsFirstY = 357;
    var starsSpacing = 54;

    for(var i=0;i<5;i++){
        var star = i < rarity ? goldenStar : greyStar;
        ctx.drawImage(star, starsX, starsFirstY - i * starsSpacing);
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

    if(data.background)
        ctx.drawImage(data.background, 0, 0, canvas.width, canvas.height);
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
    ctx.fillText(data.name ? data.name : "", 275, 69);
    
    ctx.font = '24px sans-serif';
    ctx.fillText(data.nickname ? data.nickname : "", 275, 102);

    if(data.whiteText)
        ctx.fillStyle = '#fff';
    else
        ctx.fillStyle = '#000';
    if(data.textShadow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "black";
    }
    wrapText(ctx, data.quote ? '«' + data.quote + '»' : "", canvas.width / 2, 700, canvas.width - 100, 22, 'center');
    ctx.shadowBlur = 0;
    
    var xFirstColumnSkills = 81;
    var xSecondColumnSkills = 349;
    var yFirstRowSkills = 475;
    var rowSpacingSkills = 80;
    
    var offsetX = 45;
    var offsetY = 0;
    var offsetYmultiline = -16;
    
    for(var i=0;i<6;i++){
        ctx.fillStyle = "#000";
        ctx.globalAlpha = 0.5;
        ctx.textAlign="center"; 
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText(data.valuesSkills[i] || data.valuesSkills[i] == 0 ? data.valuesSkills[i] : "", i < 3 ? xFirstColumnSkills : xSecondColumnSkills, yFirstRowSkills + rowSpacingSkills * (i % 3));
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
        var maxWidthLabelSkill = 190;
        ctx.font = 'bold 24px sans-serif';
        if(ctx.measureText(data.labelsSkills[i]).width <= maxWidthLabelSkill){
            ctx.fillText(data.labelsSkills[i] ? data.labelsSkills[i] : "", (i < 3 ? xFirstColumnSkills : xSecondColumnSkills) + offsetX, yFirstRowSkills + rowSpacingSkills * (i % 3) + offsetY);
        } else {
            wrapText(ctx, data.labelsSkills[i] ? data.labelsSkills[i] : "", (i < 3 ? xFirstColumnSkills : xSecondColumnSkills) + offsetX, yFirstRowSkills + rowSpacingSkills * (i % 3) + offsetYmultiline, maxWidthLabelSkill, 24, 'left');
        }
        ctx.shadowBlur = 0;
    }

    makeCombatMarks(ctx);
    drawStars(ctx, data.rarity ? data.rarity : 1);

    if(data.logo)
        ctx.drawImage(data.logo, 502, 48, 70, 70);
}

