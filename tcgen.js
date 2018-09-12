window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
var fs = null;

function errorHandler(e) {
  console.log(e);
}

function initFS(requestedBytes) {
    return new Promise((fulfill, reject) => {
        window.webkitStorageInfo.requestQuota(PERSISTENT, requestedBytes, function(grantedBytes) {
            window.requestFileSystem(window.PERSISTENT, grantedBytes, function(filesystem) {
                fs = filesystem;

                fulfill();
            }, errorHandler);
        }, function(e) {
            console.log('Error', e);
        });
    });
}

function reset(){
    if (confirm('Vous êtes sûr de vouloir supprimer votre historique de cartes ?')) {
        // Empty file system
        var dirReader = fs.root.createReader();
        dirReader.readEntries(function(entries) {
            for (var i = 0, entry; entry = entries[i]; ++i) {
                if (entry.isDirectory) {
                    entry.removeRecursively(function() {}, errorHandler);
                } else {
                    entry.remove(function() {}, errorHandler);
                }
            }
        }, errorHandler);

        Object.keys(Cookies.get()).forEach(function(cookie) {
            Cookies.remove(cookie, {});
        });

        displaySavedCards();
    }
}

var visibleCanvas = document.getElementById('visibleCanvas');

var data = initializeData();

var templateWhite;
var templateBlack;

var csvData;
var csvImages;
var csvBackground;
var csvLogo;
var csvWhiteText;
var csvTextShadow;
var csvLogoStroke;
var csvWhiteBorder;

var isOpera;
var isFirefox;
var isSafari;
var isIE;
var isEdge;
var isChrome;
var isBlink;

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
    'logoStroke',
    'whiteBorder',
    'isSpecialCard',
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

detectBrowser();
showChromeButtons();
showModeTable();
setCsvListeners();
updateInputFields(data);

loadStaticImages().then(() => {
    randomize(data);
    renderImage(visibleCanvas, data);
    initFS(1024*1024*1024 /*1024MB = 1GB*/).then(() => displaySavedCards());
});

function showChromeButtons(){
    if(!isChrome){
        document.getElementById('saveButton').style.display = 'none';
        document.getElementById('resetButton').style.display = 'none';
    } else {
        document.getElementById('messageChrome').style.display = 'none';
    }
}

function detectBrowser(){
    // Opera 8.0+
    isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Firefox 1.0+
    isFirefox = typeof InstallTrigger !== 'undefined';

    // Safari 3.0+ "[object HTMLElementConstructor]" 
    isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

    // Internet Explorer 6-11
    isIE = /*@cc_on!@*/false || !!document.documentMode;

    // Edge 20+
    isEdge = !isIE && !!window.StyleMedia;

    // Chrome 1+
    isChrome = !!window.chrome && !!window.chrome.webstore;

    // Blink engine detection
    isBlink = (isChrome || isOpera) && !!window.CSS;
}

function initializeData(){
    return {
        name: "", 
        nickname: "",
        quote: "",
        rarity: 1,
        whiteText: false,
        textShadow: false,
        logoStroke: false,
        valuesSkills: [0, 0, 0, 0, 0, 0],
        labelsSkills: ["", "", "", "", "", ""],
        sumValues: 0,
        isSpecialCard: false,
    }
}

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
    var widthCards = visibleCanvas.width / visibleCanvas.height * heightCards;
    var nbCardsRow = 4; // Math.floor((297 - 2 * margin) / (widthCards + margin));

    var images = [];
    for(var i=0;i<csvData.length;i++){
        if(typeof csvData[i].image == "string")
            retrieveCsvImage(csvData[i]);
        csvData[i].whiteText = csvWhiteText;
        csvData[i].textShadow = csvTextShadow;
        csvData[i].logoStroke = csvLogoStroke;
        csvData[i].whiteBorder = csvWhiteBorder;
        for(var j=0;j<csvData[i].nbCopies;j++){
            randomize(csvData[i]);

            var newCanvas = document.createElement('canvas');
            renderImage(newCanvas, csvData[i]);

            var image = newCanvas.toDataURL("image/png");
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
            "https://raw.githubusercontent.com/Minious/TCGen/master/templateBlack.png",
            "https://raw.githubusercontent.com/Minious/TCGen/master/templateWhite.png",
        ])
        .then((images) => {
            templateBlack = images[0];
            templateWhite = images[1];
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
    setCsvFileListner();
    setCsvBackgroundListener();
    setCsvLogoListener();
    setCsvImagesListeners();
    setCsvWhiteTextListener();
    setCsvTextShadowListener();
    setCsvLogoStrokeListener();
    setCsvWhiteBorderListener();
}

function setCsvFileListner(){
    document.getElementById('csvFile').addEventListener('change', function() {
        Papa.parse(this.files[0], {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                parseCsv(results.data)
            }
        });
    });
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

function setCsvWhiteTextListener(){
    document.getElementById('csvWhiteText').addEventListener('change', function() {
        csvWhiteText = document.getElementById('csvWhiteText').checked;
    })
}

function setCsvTextShadowListener(){
    document.getElementById('csvTextShadow').addEventListener('change', function() {
        csvTextShadow = document.getElementById('csvTextShadow').checked;
    })
}

function setCsvLogoStrokeListener(){
    document.getElementById('csvLogoStroke').addEventListener('change', function() {
        csvLogoStroke = document.getElementById('csvLogoStroke').checked;
    })
}

function setCsvWhiteBorderListener(){
    document.getElementById('csvWhiteBorder').addEventListener('change', function() {
        csvWhiteBorder = document.getElementById('csvWhiteBorder').checked;
    })
}

function retrieveCsvImage(curData){
    curData.image = csvImages[curData.image];
    curData.background = csvBackground;
    curData.logo = csvLogo;
}

function displaySavedCards(){
    var savedCardsIds = Cookies.getJSON('savedCardsIds');
    console.log("loading thumbnails : " + savedCardsIds);
    var thumbnails = document.getElementById("thumbnails");

    while (thumbnails.firstChild) {
        thumbnails.removeChild(thumbnails.firstChild);
    }

    if(savedCardsIds){
        for(var i=savedCardsIds.length-1;i>=0;i--){
            var id = savedCardsIds[i];
            createImageThumbnail(id);
        }
    }
}

function createImageThumbnail(id){
    getImageFromFileSystem(id+'Thumbnail').then((result) => {
        var link = document.createElement("a");
        link.onclick = getThumbnailAction(id);

        var img = document.createElement("img");
        img.src = "data:image/png;base64," + result;

        img.style.margin = "10px";

        link.appendChild(img);
        thumbnails.appendChild(link);
    });
}

function getThumbnailAction(id){
    return function(){load(id);};
}

function save(){
    var uniqid;
    if(!data.id) {
        uniqid = Date.now();
    } else {
        uniqid = data.id;
    }
    var savedCardsIds = Cookies.getJSON('savedCardsIds');
    if(!savedCardsIds) {
        savedCardsIds = [];
    }
    savedCardsIds.push(uniqid);
    Cookies.set('savedCardsIds', savedCardsIds, { expires: 365 * 100});
    
    console.log(data);

    writeImageToFileSystem(uniqid+'Thumbnail', toBase64(visibleCanvas, visibleCanvas.width * 0.1, visibleCanvas.height * 0.1));
    if(data.image)
        writeImageToFileSystem(uniqid+'Image', toBase64(data.image));
    if(data.background)
        writeImageToFileSystem(uniqid+'Background', toBase64(data.background));
    if(data.logo)
        writeImageToFileSystem(uniqid+'Logo', toBase64(data.logo));

    var savedData = JSON.parse(JSON.stringify(data));
    delete savedData.image; 
    delete savedData.background; 
    delete savedData.logo; 
    Cookies.set(uniqid, savedData, { expires: 365 * 100});

    console.log(Cookies.getJSON(uniqid));

    displaySavedCards();
}

function writeImageToFileSystem(name, img){
    if (!fs) {
        return;
    }
    fs.root.getFile(name, {create: true}, function(fileEntry) {
        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.createWriter(function(fileWriter) {
      
            fileWriter.onwriteend = function(e) {
              //console.log('Write completed.');
            };
      
            fileWriter.onerror = function(e) {
              console.log('Write failed: ' + e.toString());
            };
      
            // Create a new Blob and write it to log.txt.
            var blob = new Blob([img], {type: 'text/plain'});
      
            fileWriter.write(blob);
        }, errorHandler);
    }, errorHandler);
}

function getImageFromFileSystem(name){
    return new Promise((fulfill, reject) => {
        fs.root.getFile(name, {}, function(fileEntry) {
            // Get a File object representing the file,
            // then use FileReader to read its contents.
            fileEntry.file(function(file) {
                var reader = new FileReader();
                reader.onloadend = function(e) {
                    fulfill(this.result);
                };
                reader.readAsText(file);
            }, errorHandler);
        }, errorHandler);
    });
}

function toBase64(img, width, height) {
    var newCanvas = document.createElement('canvas'),
        ctx = newCanvas.getContext('2d');

    newCanvas.width = width ? width : img.width;
    newCanvas.height = height ? height : img.height;

    ctx.drawImage(img, 0, 0, newCanvas.width, newCanvas.height);

    return newCanvas.toDataURL().replace(/^data:image\/(png|jpg);base64,/, "");
}

function load(id){
    data = Cookies.getJSON(id);
    getImageFromFileSystem(id+'Image').then((result) => {
        var imageImage = document.createElement('img');
        imageImage.onload = function() {
            data.image = imageImage;
            renderImage(visibleCanvas, data);
        }
        imageImage.src = "data:image/png;base64," + result;
    });
    getImageFromFileSystem(id+'Background').then((result) => {
        var backgroundImage = document.createElement('img');
        backgroundImage.onload = function() {
            data.background = backgroundImage;
            renderImage(visibleCanvas, data);
        }
        backgroundImage.src = "data:image/png;base64," + result;
    });
    getImageFromFileSystem(id+'Logo').then((result) => {
        var logoImage = document.createElement('img');
        logoImage.onload = function() {
            data.logo = logoImage;
            renderImage(visibleCanvas, data);
        }
        logoImage.src = "data:image/png;base64," + result;
    });
    updateInputFields(data);
    renderImage(visibleCanvas, data);
}

function updateInputFields(data){
    for(var i=0;i<inputFields.length;i++){
        var field = document.getElementById(inputFields[i]);
        if(field.type == 'checkbox') {
            field.checked = data[inputFields[i]];
        } else if(field.type == 'text' || field.type == 'textarea' || field.type == 'number') {
            field.value = data[inputFields[i]];
        }
    }
    for(var i=0;i<data['valuesSkills'].length;i++){
        document.getElementById('valueSkill'+i).value = data['valuesSkills'][i];
    }
    for(var i=0;i<data['labelsSkills'].length;i++){
        document.getElementById('labelSkill'+i).value = data['labelsSkills'][i];
    }
    updateSumValuesField(data);
}

function setListener(propertyName){
    var field = document.getElementById(propertyName);
    if(field.type == 'checkbox') {
        field.addEventListener('change', function() {
            data[propertyName] = field.checked;
            if(field.id == "isSpecialCard"){
                updateSumValuesField(data);
            }
            renderImage(visibleCanvas, data);
        });
    } else if(field.type == 'file') {
        field.addEventListener('change', function(e) {
            var img = new Image;
            img.onload = function() {
                console.log(img);
                data[propertyName] = img;
                renderImage(visibleCanvas, data);
            }
            console.log(e.target.files[0]);
            img.src = URL.createObjectURL(e.target.files[0]);
        });
    } else if(field.type == 'text' || field.type == 'textarea' || field.type == 'number') {
        field.addEventListener('input', function() {
            data[propertyName] = field.value;
            if(field.id == "rarity"){
                updateSumValuesField(data);
            }
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

function getSumValuesFields(){
    var sum = 0;
    for(var j=0;j<data.valuesSkills.length;j++){
        sum += parseInt(document.getElementById('valueSkill'+j).value);
    }
    return sum;
}

function getMaxValues(data){
    return data.isSpecialCard ? 6 * 9 : parseInt(data.rarity) * 5 + 15;
}

function updateSumValuesField(data){
    var sum = getSumValuesFields();
    var max = getMaxValues(data);
    document.getElementById("sumValues").innerText = sum + " / " + max;
}

function setValueSkillListener(i){
  document.getElementById('valueSkill'+i).addEventListener('input', function() {
        var maxValues = getMaxValues(data);
        var sumValues = getSumValuesFields();
        if(sumValues <= maxValues) {
            data.valuesSkills[i] = document.getElementById('valueSkill'+i).value;
            updateSumValuesField(data);
            renderImage(visibleCanvas, data);
        } else {
            document.getElementById('valueSkill'+i).value = data.valuesSkills[i];
        }
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

function randomize(data){
    var pos = [];
    for(var i=0;i<6;i++)
        pos.push(i);
    data.pos = shuffle(pos);
    data.posUpperMark = Math.floor(Math.random() * 6);
}

function randomizeButton(){
    randomize(data);
    renderImage(visibleCanvas, data);
}

function drawCombatMarks(ctx, data){
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

    ctx.fillStyle = data.whiteBorder ? '#fff' : '#000';
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

function drawStars(ctx, data){
    var starsX = 96;
    var starsFirstY = 377;
    var starsSpacing = 54;

    var rarity = data.rarity ? data.rarity : 1;

    for(var i=0;i<5;i++){
        var color = data.isSpecialCard ? "#ff00fa" : (i < rarity ? '#ffd91c' : '#888');
        drawStar(ctx, starsX, starsFirstY - i * starsSpacing, color);
    }
}

function drawStar(ctx, cx, cy, color){
    var rOut = 21;
    var rMid = 19;
    var rMin = 10;
    var theta_step = 2 * Math.PI / 10;

    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(cx, cy, rOut, 0, Math.PI * 2, true);
    ctx.moveTo(cx, cy - rMid);
    for(var i=0;i<11;i++){
        var x = (rMin * (i%2) + rMid * ((i+1)%2)) * Math.cos(- Math.PI / 2 + theta_step * i);
        var y = (rMin * (i%2) + rMid * ((i+1)%2)) * Math.sin(- Math.PI / 2 + theta_step * i);
        ctx.lineTo(cx + x, cy + y);
    }
    ctx.fill();
}

function loadImage(url) {
  return new Promise((fulfill, reject) => {
    let imageObj = new Image();
    imageObj.crossOrigin = "Anonymous";
    imageObj.onload = () => fulfill(imageObj);
    imageObj.src = url;
  });
}

function displayCheckedPattern(ctx, x, y, size, nbX, nbY){
    for(var i=0;i<nbX;i++){
        for(var j=0;j<nbY;j++){
            if((i + j) % 2 == 0)
                ctx.fillStyle = "#fff";
            else
                ctx.fillStyle = "#ddd";
            ctx.beginPath();
            ctx.rect(x + i*size, y + j*size, size, size);
            ctx.fill();
        }
    }
}

function drawHeader(ctx, data){
    if(data.whiteBorder)
        ctx.fillStyle = '#000';
    else
        ctx.fillStyle = '#fff';
    ctx.textAlign = "center";
    ctx.textBaseline="middle"; 
    ctx.font = 'bold 35px sans-serif';
    ctx.fillText(data.name ? data.name : "", 275, 70);
    
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(data.nickname ? 'dit «' + data.nickname + '»' : "", 275, 102);
}

function drawQuote(ctx, data){
    if(data.whiteText)
        ctx.fillStyle = '#fff';
    else
        ctx.fillStyle = '#000';
    if(data.textShadow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "black";
    }
    ctx.font = 'bold 24px sans-serif';
    wrapText(ctx, data.quote ? '«' + data.quote + '»' : "", ctx.canvas.width / 2, 720, ctx.canvas.width - 100, 22, 'center');
    ctx.shadowBlur = 0;
}

function drawSkills(ctx, data){
    var xFirstColumnSkills = 81;
    var xSecondColumnSkills = 349;
    var yFirstRowSkills = 475;
    var rowSpacingSkills = 80;
    
    var offsetX = 45;
    var offsetY = 0;
    var offsetYmultiline = -12;

    var maxWidthLabelSkill = 186;
    var curLabelSkillFontSize = 30;
    var minLabelSkillFontSize = 24;
    
    for(var i=0;i<6;i++){
        ctx.fillStyle = "#000";
        ctx.globalAlpha = 0.5;
        ctx.textAlign="center"; 
        ctx.font = 'bold 40px sans-serif';

        var xValueSkill = i < 3 ? xFirstColumnSkills : xSecondColumnSkills;
        var yValueSkill = yFirstRowSkills + rowSpacingSkills * (i % 3);
        ctx.fillText(data.valuesSkills[i] || data.valuesSkills[i] == 0 ? data.valuesSkills[i] : "", xValueSkill, yValueSkill);
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

        ctx.font = 'bold '+curLabelSkillFontSize+'px sans-serif';

        while(minLabelSkillFontSize < curLabelSkillFontSize && ctx.measureText(data.labelsSkills[i]).width >= maxWidthLabelSkill){
            curLabelSkillFontSize--;
            ctx.font = 'bold '+curLabelSkillFontSize+'px sans-serif';
        }
        if(ctx.measureText(data.labelsSkills[i]).width <= maxWidthLabelSkill){
            ctx.fillText(data.labelsSkills[i] ? data.labelsSkills[i] : "", (i < 3 ? xFirstColumnSkills : xSecondColumnSkills) + offsetX, yFirstRowSkills + rowSpacingSkills * (i % 3) + offsetY);
        } else {
            wrapText(ctx, data.labelsSkills[i] ? data.labelsSkills[i] : "", (i < 3 ? xFirstColumnSkills : xSecondColumnSkills) + offsetX, yFirstRowSkills + rowSpacingSkills * (i % 3) + offsetYmultiline, maxWidthLabelSkill, 24, 'left');
        }
        ctx.shadowBlur = 0;
    }
}

function drawLogo(ctx, data){
    if(data.logo){
        var logo = data.logo;

        if(data.logoStroke){
            var newCanvas = document.createElement('canvas'),
                newCtx = newCanvas.getContext('2d');

            var strokeWeight = 100;

            newCanvas.width = data.logo.width + 2 * strokeWeight;
            newCanvas.height = data.logo.height + 2 * strokeWeight;

            newCtx.drawImage(data.logo, strokeWeight, strokeWeight);

            logo = addStickerEffect(newCanvas, strokeWeight);
        }
        
        ctx.drawImage(logo, 502, 48, 70, 70);
    }
}

function renderImage(canvas, data){
    var ctx = canvas.getContext('2d');

    canvas.width = templateWhite.width;
    canvas.height = templateWhite.height;
    canvas.style.width  = canvas.width/2;
    canvas.style.height = canvas.height/2;

    if(data.background)
        ctx.drawImage(data.background, 0, 0, canvas.width, canvas.height);
    else{
        var sizeCell = 42;
        displayCheckedPattern(ctx, 0, 0, sizeCell, canvas.width / sizeCell, canvas.height / sizeCell);
    }

    if(data.image)
        ctx.drawImage(data.image, 137, 131, 435, 277);
    
    ctx.drawImage(data.whiteBorder ? templateWhite : templateBlack, 0, 0);

    drawHeader(ctx, data);
    drawQuote(ctx, data);
    
    drawSkills(ctx, data)

    drawCombatMarks(ctx, data);
    drawStars(ctx, data);

    drawLogo(ctx, data);
}

