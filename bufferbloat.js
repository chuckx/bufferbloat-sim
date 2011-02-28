// Buffer Bloat Simulation

/* TODO
 - fix buffer sizes that aren't divisible by 10
 - allow packets to be handed off from buffer to transmit stream
   during pause state
 - implement error checking from web page input
 - track "latency", measured in simulation ticks
 - implement intermediate node
*/

// canvas settings
var width = 600;
var height = 400;

// packet settings

var packetsize = 15;
var packetrate = 10;


// variables defined via web page settings

// number of packets in a transmission
var maxPackets;

// size of client buffer
var clientBufferSize;


$(document).ready(function () {

    // retrieve values from web page inputs
    maxPackets = $("#maxpackets").val();

    $("#maxpackets").change(function() {
        maxPackets = $(this).val();
    });

    clientBufferSize = $("#clientbuffersize").val();

    $("#clientbuffersize").change(function() {
        clientBufferSize = $(this).val();
    });


    // prepare canvas
    var canvas = document.getElementById("bb");
    $("#bb").attr("width",width).attr("height",height);

    var context = canvas.getContext("2d");

    var simulation = new Simulation();
    simulation.start();
    simulation.setPause(true);


    // prepare controls
    $("#start").click(function() {
        if (simulation.done == false) {
            //restart to catch any change of settings
            simulation.restart();
            simulation.setPause(false);
        } else {
            simulation.restart();
        }
        $(this).attr("disabled",true);
        $("#pause").attr("disabled",false).attr("value","Pause");
    });

    $("#pause").click(function() {
        if (simulation.done == false) {
            if (simulation.pause == true) {
                simulation.setPause(false);
                $(this).attr("value","Pause");
            } else {
                simulation.setPause(true);
                $(this).attr("value","Continue");
            }
        }
    });

    (function renderLoop() {
        // clear canvas
        context.fillStyle = "#eeeeee";
        context.fillRect(0,0,width,height);

        // draw current simulation
        simulation.display(context);

        if (simulation.done == true) {
            $("#start").attr("value","Start a transmission").attr("disabled",false);
            $("#pause").attr("value","Pause").attr("disabled",true);
        }   

        // loop
        setTimeout(renderLoop,30);
    })();
});


function Simulation(canvas) {
    this.done = false;
    this.pause = true;
}

Simulation.prototype.start = function() {
    this.done = false;

    // calculate positions of simulation elements
    var hostSize = 100;
    var host1x = width/6 - hostSize/2;
    var host1y = height/4 - hostSize/2;
    var host2x = width/6*5 - hostSize/2;
    var host2y = height/4 - hostSize/2;
    this.xStart = width/6 + hostSize/2;
    this.yStart = height/4;
    this.xEnd = width/6*5 - hostSize/2;
    this.yEnd = height/4;

    this.client = new Host("Client",host1x,host1y,hostSize);
    this.server = new Host("Server",host2x,host2y,hostSize);

    this.transaction1 = new Transaction(maxPackets);
    this.transaction1.setPath(this.xStart,this.yStart,this.xEnd,this.yEnd);
    //transaction1.setPause(true);

    if (clientBufferSize > 0) {
        this.client.attachBuffer(clientBufferSize);
        this.transaction1.attachBuffer(this.client.buffer);
    }
}

Simulation.prototype.restart = function() {
    delete this.client;
    delete this.server;
    delete this.transactions1;

    this.start();
}

Simulation.prototype.setPause = function(state) {
    this.pause = state;

    this.transaction1.setPause(this.pause);
}

Simulation.prototype.display = function(canvas) {
    this.client.display(canvas);
    this.server.display(canvas);

    // draw connection between hosts
    canvas.beginPath();
    canvas.moveTo(this.xStart,this.yStart);
    canvas.lineTo(this.xEnd,this.yEnd);
    canvas.stroke();
    canvas.closePath();

    this.transaction1.display(canvas);

    if (this.transaction1.done == true) {
        this.done = true;
    }
}


function Host(label,x,y,size) {
    this.label = label;
    this.x = x;
    this.y = y;
    this.size = size;

    this.labelx = this.x + 10;
    this.labely = this.y + 10;
}

Host.prototype.attachBuffer = function(bufferSize) {
    // calculate position for buffer
    var x = this.x + this.size/9;
    var y = this.y + this.size + 5;
    this.buffer = new Buffer(x,y,bufferSize);
}

Host.prototype.display = function(canvas) {
    canvas.fillStyle = "#ffffff";
    canvas.strokeRect(this.x,this.y,this.size,this.size);
    canvas.fillRect(this.x,this.y,this.size,this.size);

    canvas.textBaseline = "top";
    canvas.strokeText(this.label,this.labelx,this.labely);

    if (this.buffer !== undefined) {
        this.buffer.display(canvas);
    }
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

    // calculate animation increments
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
    this.pause = false;
    this.packetsTransmitted = 0;

    this.transmit = new Stream(maxPackets);
    this.transmit.setColor("#00ffff");

    this.receive = new Stream(maxPackets);
    this.receive.setColor("#99ff00");
    this.receive.setTimer(false);
}

Transaction.prototype.setPath = function(xStart,yStart,xEnd,yEnd) {
    this.done = false;
    this.xStart = xStart;
    this.yStart = yStart;
    this.xEnd = xEnd;
    this.yEnd = yEnd;

    // using global packetsize to offset the transmit and receive
    // paths to help differentiate the traffic flows
    this.transmit.setPath(
        xStart,
        yStart-packetsize/2,
        xEnd,
        yEnd-packetsize/2
    );
    this.receive.setPath(
        xEnd,
        yEnd+packetsize/2,
        xStart,
        yStart+packetsize/2
    );
}

Transaction.prototype.attachBuffer = function(buffer) {
    this.buffer = buffer;
    this.transmit.setTimer(false);

    this.packetsInBuffer = 0;
    this.packetsThroughBuffer = 0;
    this.timer = 0;
}

Transaction.prototype.setPause = function(state) {
    this.pause = state;
    this.transmit.setPause(state);
    this.receive.setPause(state);
}

Transaction.prototype.display = function(canvas) {
    this.transmit.display(canvas);
    this.receive.display(canvas);

    if (this.buffer !== undefined) {
        if (this.pause == false) {
            if (this.timer % 5 == 0) {
                if (this.packetsInBuffer < this.maxPackets) {
                    
                    this.buffer.addPacket();
                    this.packetsInBuffer++;
                }
            }
            this.timer++;

            if (this.packetsThroughBuffer != this.buffer.packetsDone) {
                var packetsToAdd = 
                    this.buffer.packetsDone - this.packetsThroughBuffer;
                for (var i=0; i < packetsToAdd; i++) {
                    this.transmit.addPacket();
                    this.packetsThroughBuffer++;
                }
            }
        }

        this.buffer.display(canvas);
    }

    if (this.packetsTransmitted != this.transmit.packetsDone) {
        var packetsToAdd = this.transmit.packetsDone - this.packetsTransmitted;

        for (var i=0; i < packetsToAdd; i++) {
            this.receive.addPacket();
        }

        this.packetsTransmitted = this.transmit.packetsDone;
    }

    if (this.receive.packetsDone == maxPackets) {
        this.done = true;
    }
}

function Buffer(x,y,size) {
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 200;
    this.size = size;

    this.rows = 10;
    this.columns = Math.floor(this.size / this.rows);
    this.blankGrid = 0;
    if (this.size % this.rows > 0) {
        this.blankGrid = this.rows - (this.size % this.rows);
        this.columns += 1;
    }
    console.log(this.columns + "," + this.blankGrid);

    this.vStep = this.height/this.rows;
    this.hStep = this.width/this.columns;

    // create an array of grid positions
    this.grid = new Array(this.size);

    var columnOffset = 0;
    if (this.size & this.rows > 0) {
        // starting position
        this.grid[0].x = this.x;
        this.grid[0].y = 
            this.y+(this.height-(this.blankGrid*this.vStep+this.vStep))

        // remainder of first column
        var l = this.grid.length;
        for (var i=l; i<(this.rows-this.blankGrid); i++) {
            var previous = i-1;
            this.grid[i] = {};
            this.grid[i].x = this.x;
            this.grid[i].y = this.grid[previous].y - this.vStep
        }
        columnOffset = 1;
    }

    // remainder of the grid
    var arrayOffset = this.grid.length;
    for (var i=0; i < (this.size-this.blankGrid) ;i++) {
        var column = Math.floor(i / this.rows) + columnOffset;
        var row = this.rows - (Math.floor(i % this.rows));
        this.grid[i+arrayOffset] = {
            x: this.x + column*this.hStep, 
            y: this.y + row*this.vStep - this.vStep
        }
    }

    this.maxPackets = maxPackets;
    this.packetCount = 0;
    this.packetsDone = 0;
    this.packets = new Array();
}

Buffer.prototype.addPacket = function() {
    if (this.packetCount < this.maxPackets) {
        index = this.packets.length;
        this.packets[index] = {};
        this.packets[index].x = this.grid[1].x;
        this.packets[index].y = this.grid[1].y;
        this.packets[index].position = 1;
        this.packetCount++;
    }
}

Buffer.prototype.stepPackets = function() {
    for (var i=0; i < this.packets.length; i++) {
        if (this.packets[i].position >= this.size) {
            this.packets.shift();
            this.packetsDone++;
        } else {
            this.packets[i].position++;
            this.packets[i].x = this.grid[this.packets[i].position].x;
            this.packets[i].y = this.grid[this.packets[i].position].y;
        }
    }
}

Buffer.prototype.display = function(canvas) {
    canvas.fillStyle = "#ffffff";
    canvas.strokeRect(this.x,this.y,this.width,this.height);
    canvas.strokeText("Buffer",this.x,this.y+this.height+5);

    // draw grid
    canvas.beginPath();
    for (var i=1;i<this.rows;i++) {
        canvas.moveTo(this.x,this.y+(i*this.vStep));
        canvas.lineTo(this.x+this.width,this.y+(i*this.vStep));
    }
    for (var i=1;i<this.columns;i++) {
        canvas.moveTo(this.x+(i*this.hStep),this.y);
        canvas.lineTo(this.x+(i*this.hStep),this.y+this.height);
    }
    canvas.stroke();
    canvas.closePath();

    // fill in blank grid elements
    if (this.blankGrid > 0) {
        canvas.fillStyle = "#000000";
        canvas.fillRect(
            this.x,
            this.y+(this.height-(this.blankGrid*this.vStep)),
            this.hStep,
            this.blankGrid*this.vStep
        );
    }

    /*
    // TEST - fill in grid elements
    for (var i=0;i<this.grid.length;i++) {
        canvas.globalAlpha = 0.9;
        canvas.fillStyle = "#00ee00";
        canvas.fillRect(this.grid[i].x,this.grid[i].y,this.hStep,this.vStep);
    }
    */

    // draw packets currently in the buffer
    if (this.packets.length > 0) {
        for (var i=0; i<this.packets.length; i++) {
            // make packets a bit smaller than the grid outline
            var offset = 2;
            canvas.fillStyle = "#00ee00";
            canvas.fillRect(
                this.packets[i].x+offset,
                this.packets[i].y+offset,
                this.hStep-offset,
                this.vStep-offset
            );
        }
    } 

    // step packets to their next position
    this.stepPackets();
}
