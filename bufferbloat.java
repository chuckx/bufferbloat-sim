float x,y;
float hs = 100.0;
float ps = 20;
float rate = 15;
int maxPackets = 20;

Host host1;
Host host2;
Transaction transaction1;

// Processing.js functions

void setup() {
    // size of canvas
    size(800,400);
    noStroke();
    frameRate(30);

    host1 = new Host(width/6,height/2,hs);
    host2 = new Host(width/6*5,height/2,hs);

    transaction1 = new Transaction(maxPackets);
    transaction1.setPath(width/6+hs/2,height/2,width/6*5-hs/2,height/2);
}

void draw() {
    background(#222222);

    // draw hosts
    host1.display();
    host2.display();

    // draw connection between hosts
    line(width/6,height/2,width/6*5,height/2);

    transaction1.display();
}


// class definitions

class Host {
    float xpos;
    float ypos;
    float size;

    Host(float x, float y, float s) {
        xpos = x;
        ypos = y;
        size = s;
    }

    void display() {
        stroke();
        fill(255);
        rectMode(CENTER);
        rect(xpos,ypos,size,size);
    }
}

class Packet {
    private float size;
    private float rate;
    private int color;
    private int timer;
    boolean done;

    private float xpos;
    private float ypos;
    private float xStart;
    private float yStart;
    private float xEnd;
    private float yEnd;

    Packet(float _size, float _rate, int _color, int _timer) {
        size = _size;
        rate = _rate;
        color = _color;
        timer = _timer;
        done = false;
    }

    Packet(float _size, float _rate, int _color) {
        size = _size;
        rate = _rate;
        color = _color;
        timer = -1;
        done = false;
    }

    void setPath(float _xStart, float _yStart, float _xEnd, float _yEnd) {
        xStart = _xStart;
        yStart = _yStart;
        xEnd = _xEnd;
        yEnd = _yEnd;

        xpos = xStart;
        ypos = yStart;
    }

    void display() {
        if (timer != 0) {
            //console.log(xpos + "," + ypos);

            fill(color);
            ellipse(xpos,ypos,size,size);

            // defines rate at which the packet animates
            xpos = getDelta(xpos,xStart,xEnd);
            ypos = getDelta(ypos,yStart,yEnd);
        }
    }

    private float getDelta(float delta, float start, float end) {
        if (start == end) {
            delta = start;
        } else {
            if (start < end) {
                delta = delta + rate;
                if (delta > end) {
                    delta = start;
                    timer--; 
                }
            } else {
                delta = delta - rate;
                if (delta < end) {
                    delta = start;
                    timer--;
                }
            }
        }

        if (timer == 0) {
            done = true;
        }

        return delta;
    }
}

class Stream {
    int maxPackets;
    int packetCount;
    int timer;
    int color;
    boolean useTimer;
    boolean pause;
    int packetsDone;
    boolean[] packetState;
    Packet[] packets;

    float xStart;
    float yStart;
    float xEnd;
    float yEnd;

    Stream (int _maxPackets) {
        maxPackets = _maxPackets;
        packetCount = 0;
        timer = 0;
        color = #0000ff;
        useTimer = true;
        pause = false;
        packetsDone = 0;
        packetState = new boolean[maxPackets];
        packets = new Packet[maxPackets];
    }

    void setColor (int _color) {
        color = _color;
    }

    void setPath(float _xStart, float _yStart, float _xEnd, float _yEnd) {
        xStart = _xStart;
        yStart = _yStart;
        xEnd = _xEnd;
        yEnd = _yEnd;
    }

    void toggleTimer() {
        if (useTimer == true) {
            useTimer = false;
        } else {
            useTimer = true;
        }
    }

    void togglePause() {
        if (pause == true) {
            pause = false;
        } else {
            pause = true;
        }
    }

    void addPacket() {
        if (packetCount < maxPackets) {
            // rate is a global variable
            packets[packetCount] = new Packet(ps,rate,color,1);
            packets[packetCount].setPath(xStart,yStart,xEnd,yEnd);
            packetState[packetCount] = false;
            packetCount++;
        }
    }

    void display() {
        for (i = 0; i < packetCount; i++) {
            packets[i].display();
            if (packetState[i] == false) {
                if (packets[i].done == true) {
                    packetState[i] = true;
                    packetsDone++;                
                }
            }
        }

        if (useTimer == true) {
            if (pause == false) {
                timer++;
                if (timer % 5 == 0) {
                    addPacket();
                }
            }
        }
    }
}

class Transaction {
    int maxPackets;
    int packetsTransmitted;
    Stream transmit;
    Stream receive;

    float xStart;
    float yStart;
    float xEnd;
    float yEnd;

    Transaction(int _maxPackets) {
        maxPackets = _maxPackets;
        packetsTransmitted = 0;

        transmit = new Stream(maxPackets);
        transmit.setColor(#0000ff);

        receive = new Stream(maxPackets);
        receive.setColor(#00ff00);
        receive.toggleTimer();
    }

    void setPath(float _xStart, float _yStart, float _xEnd, float _yEnd) {
        xStart = _xStart;
        yStart = _yStart;
        xEnd = _xEnd;
        yEnd = _yEnd;

        transmit.setPath(xStart,yStart,xEnd,yEnd);
        receive.setPath(xEnd,yEnd,xStart,yStart);
    }

    void display() {
        transmit.display();
        receive.display();

        if (packetsTransmitted != transmit.packetsDone) {
            //console.log(packetsTransmitted + "," + transmit.packetsDone);
            int packetsToAdd = transmit.packetsDone - packetsTransmitted;

            for (int i=0; i < packetsToAdd; i++) {
                receive.addPacket();
            }

            packetsTransmitted = transmit.packetsDone;
        }
    }
}
