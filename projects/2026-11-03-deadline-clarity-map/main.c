#include "deadline_map.h"
#include <stdio.h>

int main(int argc,char **argv){
    if(argc!=4){fprintf(stderr,"Usage: %s INPUT.csv OUTPUT.html YYYY-MM-DD\n",argv[0]);return 2;}
    Date as_of; if(!parse_date(argv[3],&as_of)){fputs("Invalid as-of date; use YYYY-MM-DD.\n",stderr);return 2;}
    FILE *in=fopen(argv[1],"r"); if(!in){perror(argv[1]);return 1;}
    Notice items[MAX_NOTICES]; size_t count=0; char error[160];
    int ok=read_notices(in,items,&count,error,sizeof error); fclose(in);
    if(!ok){fprintf(stderr,"Input error: %s\n",error);return 1;}
    FILE *out=fopen(argv[2],"w"); if(!out){perror(argv[2]);return 1;}
    ok=write_report(out,items,count,as_of); if(fclose(out)!=0)ok=0;
    if(!ok){fputs("Could not write report.\n",stderr);return 1;}
    printf("Wrote %zu notices to %s\n",count,argv[2]); return 0;
}
