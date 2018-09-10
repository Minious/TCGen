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
                
                // Empty file system
                /*
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
                */

                fulfill();
            }, errorHandler);
        }, function(e) {
            console.log('Error', e);
        });
    });
}

var visibleCanvas = document.getElementById('visibleCanvas');
var hiddenCanvas = document.getElementById('hiddenCanvas');

var data = initializeData();

var template, goldenStar, greyStar;

var csvData;
var csvImages;
var csvBackground;
var csvLogo;
var csvWhiteText;
var csvTextShadow;

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
updateInputFields(data);

loadStaticImages().then(() => {
    randomize();
    renderImage(visibleCanvas, data);
    renderImage(hiddenCanvas, data);
    initFS(1024*1024*1024 /*1024MB = 1GB*/).then(() => displaySavedCards());
});

function initializeData(){
    return {
        name: "", 
        nickname: "",
        quote: "",
        rarity: 1,
        whiteText: false,
        textShadow: false,
        valuesSkills: [0, 0, 0, 0, 0, 0],
        labelsSkills: ["", "", "", "", "", ""]}
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
    var widthCards = hiddenCanvas.width / hiddenCanvas.height * heightCards;
    var nbCardsRow = 4; // Math.floor((297 - 2 * margin) / (widthCards + margin));
    console.log(nbCardsRow);

    var images = [];
    for(var i=0;i<csvData.length;i++){
        retrieveCsvImage(csvData[i]);
        csvData[i].whiteText = csvWhiteText;
        csvData[i].textShadow = csvTextShadow;
        for(var j=0;j<csvData[i].nbCopies;j++){
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
            "https://raw.githubusercontent.com/Minious/TCGen/master/template.png",
            "https://raw.githubusercontent.com/Minious/TCGen/master/etoile_doree.png",
            "https://raw.githubusercontent.com/Minious/TCGen/master/etoile_grise.png",
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
    setCsvFileListner();
    setCsvBackgroundListener();
    setCsvLogoListener();
    setCsvImagesListeners();
    setCsvWhiteTextListener();
    setCsvTextShadowListener();
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

function retrieveCsvImage(curData){
    curData.image = csvImages[curData.image];
    curData.background = csvBackground;
    curData.logo = csvLogo;
}

function displaySavedCards(){
    var savedCardsIds = Cookies.getJSON('savedCardsIds');
    console.log("loading thumbnails : " + savedCardsIds);
    if(savedCardsIds){
        var thumbnails = document.getElementById("thumbnails");

        while (thumbnails.firstChild) {
            thumbnails.removeChild(thumbnails.firstChild);
        }

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
    console.log(data);
    updateInputFields(data);
    renderImage(visibleCanvas, data);
}

function updateInputFields(data){
    for(var i=0;i<inputFields.length;i++){
        var field = document.getElementById(inputFields[i]);
        if(field.type == 'checkbox') {
            field.checked = data[inputFields[i]];
        } else if(field.type == 'file') {
            // TO DO
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
}

function setListener(propertyName){
    var field = document.getElementById(propertyName);
    if(field.type == 'checkbox') {
        field.addEventListener('change', function() {
            data[propertyName] = field.checked;
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
    
    ctx.font = 'bold 35px sans-serif';
    ctx.fillText(data.name ? data.name : "", 275, 70);
    
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(data.nickname ? 'dit «' + data.nickname + '»' : "", 275, 102);

    if(data.whiteText)
        ctx.fillStyle = '#fff';
    else
        ctx.fillStyle = '#000';
    if(data.textShadow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "black";
    }
    ctx.font = 'bold 24px sans-serif';
    wrapText(ctx, data.quote ? '«' + data.quote + '»' : "", canvas.width / 2, 720, canvas.width - 100, 22, 'center');
    ctx.shadowBlur = 0;
    
    var xFirstColumnSkills = 81;
    var xSecondColumnSkills = 349;
    var yFirstRowSkills = 475;
    var rowSpacingSkills = 80;
    
    var offsetX = 45;
    var offsetY = 0;
    var offsetYmultiline = -12;
    
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
        var maxWidthLabelSkill = 186;
        var curLabelSkillFontSize = 30;
        var minLabelSkillFontSize = 24;
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

    makeCombatMarks(ctx);
    drawStars(ctx, data.rarity ? data.rarity : 1);

    if(data.logo)
        ctx.drawImage(data.logo, 502, 48, 70, 70);
}

