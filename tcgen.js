var canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');

var data = {valeurComp: [], labelComp: []};

renderImage(data);

document.getElementById('whiteText').addEventListener('change', function() {
    data.whiteText = document.getElementById('whiteText').checked;
    renderImage(data);
});

document.getElementById('name').addEventListener('input', function() {
    data.name = document.getElementById('name').value;
    renderImage(data);
});

document.getElementById('surname').addEventListener('input', function() {
    data.surname = document.getElementById('surname').value;
    renderImage(data);
});

document.getElementById('citation').addEventListener('input', function() {
    data.citation = document.getElementById('citation').value;
    renderImage(data);
});

document.getElementById('rarete').addEventListener('input', function() {
    data.rarete = document.getElementById('rarete').value;
    renderImage(data);
});

for(var i=0;i<6;i++){
	setValeurCompListener(i);
	setLabelCompListener(i);
}

function download(){
    var download = document.getElementById("download");
    var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    download.setAttribute("href", image);
}

function setValeurCompListener(i){
  document.getElementById('valeurComp'+i).addEventListener('input', function() {
      data.valeurComp[i] = document.getElementById('valeurComp'+i).value;
      renderImage(data);
  });
}

function setLabelCompListener(i){
  document.getElementById('labelComp'+i).addEventListener('input', function() {
      data.labelComp[i] = document.getElementById('labelComp'+i).value;
      renderImage(data);
  });
}

document.getElementById('image').addEventListener('change', function(e) {
    var img = new Image;
    img.onload = function() {
        data.image = img;
        renderImage(data);
    }
    img.src = URL.createObjectURL(e.target.files[0]);
});

document.getElementById('fond').addEventListener('change', function(e) {
    var img = new Image;
    img.onload = function() {
        data.fond = img;
        renderImage(data);
    }
    img.src = URL.createObjectURL(e.target.files[0]);
});

document.getElementById('logo').addEventListener('change', function(e) {
    var img = new Image;
    img.onload = function() {
        data.logo = img;
        renderImage(data);
    }
    img.src = URL.createObjectURL(e.target.files[0]);
});

function wrapText(text, x, y, maxWidth, lineHeight) {
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

function makeCombatMarks(){
    var colors = ['#00aeef', '#fff200', '#ed1c24', '#fff', '#8dc63f', '#f7941d'];
    
    var margin = 13;
    var widthMark = 99;
    var heightMark = 13;
    var yPosMarks = 864;
    var pos = [];
    for(var i=0;i<6;i++)
        pos.push(i);
    pos = shuffle(pos);

    for(var i=0;i<6;i++){
        //alert(pos[i]);
        ctx.fillStyle = colors[pos[i]];
        ctx.beginPath();
        ctx.rect(margin + i * widthMark, yPosMarks, widthMark, heightMark);
        ctx.fill();
    }

    var posUpperMark = Math.floor(Math.random() * 6);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.rect(margin + posUpperMark * widthMark, 0, widthMark, heightMark);
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

function drawEtoiles(rarete, etoile_doree, etoile_grise){
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
    imageObj.src = url;
    imageObj.crossOrigin = "Anonymous";
    imageObj.onload = () => fulfill(imageObj);
  });
}

function renderImage(data){
    Promise.all([
        //loadImage("template2.png"),
        //loadImage("etoile_doree.png"),
        //loadImage("etoile_grise.png"),
        loadImage("https://image.ibb.co/d65b7z/template2.png"),
        loadImage("https://image.ibb.co/dyaLZe/etoile_doree.png"),
        loadImage("https://image.ibb.co/dTguue/etoile_grise.png"),
    ])
    .then((images) => {
        var img = images[0];
        var etoile_doree = images[1];
        var etoile_grise = images[2];

        canvas.width = img.width;
        canvas.height = img.height;
        canvas.style.width  = img.width/2;
        canvas.style.height = img.height/2;

        if(data.fond)
            ctx.drawImage(data.fond, 0, 0, canvas.width, canvas.height);
        else{
            ctx.fillStyle = "#fa00ff";
            ctx.beginPath();
            ctx.rect(0, 0, img.width, img.height);
            ctx.fill();
        }

        if(data.image)
            ctx.drawImage(data.image, 137, 131, 435, 277);
        
        ctx.drawImage(img, 0, 0);
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
        //ctx.fillText(data.citation ? data.citation : "", canvas.width / 2, 650);
        wrapText(data.citation ? '«' + data.citation + '»' : "", canvas.width / 2, 700, canvas.width - 100, 22);
        
        var xFirstColumnComp = 81;
        var xSecondColumnComp = 327;
        var yFirstRowComp = 478;
        var rowSpacingComp = 80;
        
        var offsetX = 45;
        var offsetY = 0;
        
        for(var i=0;i<6;i++){
            ctx.fillStyle = "#000";//colors[i];
            ctx.globalAlpha = 0.5;
            ctx.textAlign="center"; 
            ctx.font = 'bold 40px sans-serif';
            ctx.fillText(data.valeurComp[i] || data.valeurComp[i] == 0 ? data.valeurComp[i] : "", i < 3 ? xFirstColumnComp : xSecondColumnComp, yFirstRowComp + rowSpacingComp * (i % 3));
            ctx.globalAlpha = 1;

            if(data.whiteText)
                ctx.fillStyle = '#fff';
            else
                ctx.fillStyle = '#000';
            //ctx.shadowBlur = 10;
            ctx.shadowColor = "black";
            ctx.textAlign="left"; 
            ctx.font = '30px sans-serif';
            ctx.fillText(data.labelComp[i] ? data.labelComp[i] : "", (i < 3 ? xFirstColumnComp : xSecondColumnComp) + offsetX, yFirstRowComp + rowSpacingComp * (i % 3) + offsetY);
            //ctx.shadowBlur = 0;
        }

        makeCombatMarks();
        drawEtoiles(data.rarete ? data.rarete : 1, etoile_doree, etoile_grise);

        if(data.logo)
            ctx.drawImage(data.logo, 502, 48, 70, 70);
    })
    .catch( (e) => alert(e) );
}

