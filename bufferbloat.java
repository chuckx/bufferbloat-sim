float x,y;
float s = 100.0;
float ps = 20;
float rate = 5;
int maxPackets = 10;

Host host1;
Host host2;
Packet[] packets;

void setup() {
    // size of canvas
    size(600,400);
    noStroke();
    frameRate(30);

    host1 = new Host(width/6,height/2,s);
    host2 = new Host(width/6*5,height/2,s);

    packets = new Packet[10];

    packets[0] = new Packet(ps,rate,#0000ff);
    packets[1] = new Packet(ps,rate,#ffcc00);

    packets[0].setPath(width/6+s/2,height/2,width/6*5-s/2,height/2);
    packets[1].setPath(width/6*5-s/2,height/2,width/6+s/2,height/2);
}

void draw() {
    background(150);

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
    int color;

    private float xt;
    private float yt; 

    private float xpos;
    private float ypos;
    private float xStart;
    private float yStart;
    private float xEnd;
    private float yEnd;

    Packet(float s, float r, int c) {
        size = s;
        rate = r;
        color = c;

        xt = 0;
        yt = 0;
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
        // defines rate at which the packet animates
        xt = getDelta(xt,xStart,xEnd);
        yt = getDelta(yt,yStart,yEnd);
   
        console.log(xEnd + "," + yEnd + "," + xt + "," + yt);
        translate(xt,yt);

        fill(color);
        ellipse(xpos,ypos,size,size);
    }

    private float getDelta(float delta, float start, float end) {
        if (start == end) {
            delta = 0;
        } else {
            if (start < end) {
                delta = delta + rate;
                if (delta > (end - start)) {
                    delta = 0;
                }
            } else {
                delta = delta - rate;
                if (delta < (end - start)) {
                    delta = 0;
                }
            }
        }

        return delta;
    }
}
