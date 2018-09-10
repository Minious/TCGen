
function addStickerEffect(img, strokeWeight){

    // canvas related variables
    var canvas=document.getElementById("canvas");
    var ctx=canvas.getContext("2d");

    // variables used in pixel manipulation
    var canvases=[];
    var imageData,data,imageData1,data1;

    // true/false function used by the edge detection method
    var defineNonTransparent=function(x,y){
        return(data1[(y*cw+x)*4+3]>0);
    }

    return addStickerEffect();

    function addStickerEffect(){

        // resize the main canvas to the image size
        canvas.width=cw=img.width;
        canvas.height=ch=img.height;

        // draw the image on the main canvas
        ctx.drawImage(img,0,0);

        // Move every discrete element from the main canvas to a separate canvas
        // The sticker effect is applied individually to each discrete element and
        // is done on a separate canvas for each discrete element
        while(moveDiscreteElementToNewCanvas()){}

        // add the sticker effect to all discrete elements (each canvas)
        for(var i=0;i<canvases.length;i++){
            _addStickerEffect(canvases[i],strokeWeight);
            ctx.drawImage(canvases[i],0,0);
        }

        // redraw the original image
        //   (necessary because the sticker effect 
        //    slightly intrudes on the discrete elements)
        ctx.drawImage(img,0,0);

        return 
    }

    // 
    function _addStickerEffect(canvas,strokeWeight){
        var url=canvas.toDataURL();
        var ctx1=canvas.getContext("2d");
        var pts=canvas.outlinePoints;
        addStickerLayer(ctx1,pts,strokeWeight);
        var imgx=new Image();
        imgx.onload=function(){
            ctx1.drawImage(imgx,0,0);
        }
        imgx.src=url;    
    }


    function addStickerLayer(context,points,weight){

        imageData=context.getImageData(0,0,canvas.width,canvas.height);
        data1=imageData.data;

        var points=geom.contour(defineNonTransparent);

        defineGeomPath(context,points)
        context.lineJoin="round";
        context.lineCap="round";
        context.strokeStyle="white";
        context.lineWidth=weight;
        context.stroke();
    }

    // This function finds discrete elements on the image
    // (discrete elements == a group of pixels not touching
    //  another groups of pixels--e.g. each individual sprite on
    //  a spritesheet is a discreet element)
    function moveDiscreteElementToNewCanvas(){

        // get the imageData of the main canvas
        imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
        data1=imageData.data;

        // test & return if the main canvas is empty
        // Note: do this b/ geom.contour will fatal-error if canvas is empty
        var hit=false;
        for(var i=0;i<data1.length;i+=4){
            if(data1[i+3]>0){hit=true;break;}
        }
        if(!hit){return;}

        // get the point-path that outlines a discrete element
        var points=geom.contour(defineNonTransparent);

        // create a new canvas and append it to page
        var newCanvas=document.createElement('canvas');
        newCanvas.width=canvas.width;
        newCanvas.height=canvas.height;
        document.body.appendChild(newCanvas);
        canvases.push(newCanvas);
        var newCtx=newCanvas.getContext('2d');

        // attach the outline points to the new canvas (needed later)
        newCanvas.outlinePoints=points;

        // draw just that element to the new canvas
        defineGeomPath(newCtx,points);
        newCtx.save();
        newCtx.clip();
        newCtx.drawImage(canvas,0,0);
        newCtx.restore();

        // remove the element from the main canvas
        defineGeomPath(ctx,points);
        ctx.save();
        ctx.clip();
        ctx.globalCompositeOperation="destination-out";
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.restore();

        return(true);
    }


    // utility function
    // Defines a path on the canvas without stroking or filling that path
    function defineGeomPath(context,points){
        context.beginPath();
        context.moveTo(points[0][0],points[0][1]);  
        for(var i=1;i<points.length;i++){
            context.lineTo(points[i][0],points[i][1]);
        }
        context.lineTo(points[0][0],points[0][1]);
        context.closePath();    
    }

}