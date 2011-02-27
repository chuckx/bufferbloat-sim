// Buffer Bloat Simulation

var width = 800;
var height = 200;
var maxPackets = 20;

// packet settings
var packetsize = 15;
var packetrate = 10;

$(document).ready(function () {
    var canvas = document.getElementById("bb");
    $("#bb").attr("width",width).attr("height",height);

    var context = canvas.getContext("2d");

    var simulation = new Simulation();

    (function renderLoop() {
        // clear canvas
        context.fillStyle = "#ffffff";
        context.fillRect(0,0,width,height);

        // draw current simulation
        simulation.display(context);

        // loop
        setTimeout(renderLoop,30);
    })();
});


function Simulation(canvas) {
    // calculate positions of simulation elements
    var hostSize = 100;
    var host1x = width/6 - hostSize/2;
    var host1y = height/2 - hostSize/2;
    var host2x = width/6*5 - hostSize/2;
    var host2y = height/2 - hostSize/2;
    this.xStart = width/6 + hostSize/2;
    this.yStart = height/2;
    this.xEnd = width/6*5 - hostSize/2;
    this.yEnd = height/2;

    this.host1 = new Host(host1x,host1y,hostSize);
    this.host2 = new Host(host2x,host2y,hostSize);

    this.transaction1 = new Transaction(maxPackets);
    this.transaction1.setPath(this.xStart,this.yStart,this.xEnd,this.yEnd);
    //transaction1.setPause(true);
}

Simulation.prototype.display = function(canvas) {
    this.host1.display(canvas);
    this.host2.display(canvas);

    // draw connection between hosts
    canvas.beginPath();
    canvas.moveTo(this.xStart,this.yStart);
    canvas.lineTo(this.xEnd,this.yEnd);
    canvas.stroke();
    canvas.closePath();

    this.transaction1.display(canvas);
}



function Host(x,y,size) {
    this.x = x;
    this.y = y;
    this.size = size;
}

Host.prototype.display = function(canvas) {
    canvas.strokeRect(this.x,this.y,this.size,this.size);
}


function Packet(size,rate,color,timer) {
    this.size = size;
    this.rate = rate;
    this.color = color;
    this.timer = timer;
    this.done = false;
}

Packet.prototype.setPath = function(xStart,yStart,xEnd,yEnd) {
    this.xStart = xStart - this.size/2;
    this.yStart = yStart - this.size/2;
    this.xEnd = xEnd - this.size/2;
    this.yEnd = yEnd - this.size/2;

    this.x = this.xStart;
    this.y = this.yStart;

    var dx = this.xEnd - this.xStart;
    var dy = this.yEnd - this.yStart;
    this.numPoints = Math.floor(Math.sqrt(dx*dx + dy*dy) / packetrate) - 1;
    this.stepCount = 0;
    this.stepx = dx / this.numPoints;
    this.stepy = dy / this.numPoints;
}

Packet.prototype.display = function(canvas) {
    if (this.timer != 0) {
        canvas.fillStyle = this.color;
        canvas.fillRect(this.x,this.y,this.size,this.size);

        this.step();
    }
}

Packet.prototype.step = function() {
    this.x = this.x + this.stepx;
    this.y = this.y + this.stepy;

    this.stepCount++;

    if (this.stepCount == this.numPoints) {
        this.timer--;
    }

    if (this.timer == 0) {
        this.done = true;
    }
}


function Stream(maxPackets) {
    this.maxPackets = maxPackets;
    this.packetRate = packetrate; // from global setting
    this.packetCount = 0;
    this.packetsDone = 0;
    this.packetState = new Array(maxPackets);
    this.packets = new Array(maxPackets);

    this.timer = 0;
    this.color = "#0000ff";
    this.useTimer = true;
    this.pause = false;
}

Stream.prototype.setColor = function(color) {
    this.color = color
}

Stream.prototype.setPath = function(xStart,yStart,xEnd,yEnd) {
    this.xStart = xStart;
    this.yStart = yStart;
    this.xEnd = xEnd;
    this.yEnd = yEnd;
}

Stream.prototype.setTimer = function(state) {
    this.useTimer = state;
}

Stream.prototype.setPause = function(state) {
    this.pause = state;
}

Stream.prototype.addPacket = function() {
    if (this.packetCount < this.maxPackets) {
        this.packets[this.packetCount] = 
            new Packet(packetsize,this.packetRate,this.color,1);
        this.packets[this.packetCount].setPath(
            this.xStart,this.yStart,this.xEnd,this.yEnd
        );
        this.packetState[this.packetCount] = false;
        this.packetCount++;
    }
}

Stream.prototype.display = function(canvas) {
    for (i=0; i < this.packetCount; i++) {
        this.packets[i].display(canvas);

        if (this.packetState[i] == false) {
            if (this.packets[i].done == true) {
                this.packetState[i] = true;

                this.packetsDone++;
            }
        }
    }

    if (this.useTimer == true) {
        if (this.pause == false) {
            this.timer++;
            if (this.timer % 5 == 0) {
                this.addPacket();
            }
        }
    }
}


function Transaction(maxPackets) {
    this.maxPackets = maxPackets;
    this.packetsTransmitted = 0;

    this.transmit = new Stream(maxPackets);
    this.transmit.setColor("#00ff00");

    this.receive = new Stream(maxPackets);
    this.receive.setColor("#0000ff");
    this.receive.setTimer(false);
}

Transaction.prototype.setPath = function(xStart,yStart,xEnd,yEnd) {
    this.xStart = xStart;
    this.yStart = yStart;
    this.xEnd = xEnd;
    this.yEnd = yEnd;

    this.transmit.setPath(xStart,yStart,xEnd,yEnd);
    this.receive.setPath(xEnd,yEnd,xStart,yStart);
}

Transaction.prototype.setPause = function(state) {
    this.transmit.setPause(state);
    this.receive.setPause(state);
}

Transaction.prototype.display = function(canvas) {
    this.transmit.display(canvas);
    this.receive.display(canvas);

    if (this.packetsTransmitted != this.transmit.packetsDone) {
        var packetsToAdd = this.transmit.packetsDone - this.packetsTransmitted;

        for (var i=0; i < packetsToAdd; i++) {
            this.receive.addPacket();
        }

        this.packetsTransmitted = this.transmit.packetsDone;
    }
}
