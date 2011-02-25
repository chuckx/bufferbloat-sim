float x,y;
float hs = 100.0;
float ps = 20;
float rate = 5;
int maxPackets = 10;

Host host1;
Host host2;
Packet[] packets;

void setup() {
    // size of canvas
    size(800,400);
    noStroke();
    frameRate(30);

    host1 = new Host(width/6,height/2,hs);
    host2 = new Host(width/6*5,height/2,hs);

    packets = new Packet[10];

    packets[0] = new Packet(ps,rate,#0000ff,2);
    packets[1] = new Packet(ps,rate,#ffcc00,2);

    packets[0].setPath(width/6+hs/2,height/2,width/6*5-hs/2,height/2);
    packets[1].setPath(width/6*5-hs/2,height/2,width/6+hs/2,height/2);
}

void draw() {
    background(#222222);

    host1.display();
    host2.display();

    line(width/6,height/2,width/6*5,height/2);

    packets[0].display();
    packets[1].display();
}

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
    private int timer = -1;

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
    }

    Packet(float _size, float _rate, int _color) {
        size = _size;
        rate = _rate;
        color = _color;
    }

    void setPath(float x1, float y1, float x2, float y2) {
        xStart = x1;
        yStart = y1;
        xEnd = x2;
        yEnd = y2;

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

        return delta;
    }
}
