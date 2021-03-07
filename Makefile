OBJ=	main.o base64.o global.o console.o process.o net.o fs.o buffer.o mysql.o http.o gd.o ncurses.o sem.o logfile.o v8.o

CFLAGS = -O6 -fomit-frame-pointer -fdata-sections -ffunction-sections -fno-strict-aliasing -fno-rtti -fno-exceptions -fvisibility=hidden -Wall -W -Wno-unused-parameter -Wnon-virtual-dtor -m64 -O3 -fomit-frame-pointer -fdata-sections -ffunction-sections -ansi -fno-strict-aliasing

%.o: %.cpp SilkJS.h Makefile
	g++ $(CFLAGS) -c -I../v8-read-only/include -I/usr/include/mysql -g -o $*.o $*.cpp

SilkJS:	$(OBJ) SilkJS.h Makefile
	g++ $(CFLAGS) -o SilkJS $(OBJ) -L../v8-read-only -lv8 -L/usr/local/lib/mysql -lmysqlclient -lmm -lgd -lncurses -lssl -lpthread

clean:
	rm SilkJS *.o

release: SilkJS
	tar czvfp ~/SilkJS.tgz SilkJS examples httpd lib

$(OBJ): SilkJS.h Makefile
