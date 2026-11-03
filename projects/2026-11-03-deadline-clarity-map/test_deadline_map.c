#include "deadline_map.h"
#include <stdio.h>
#include <string.h>

static int failures=0;
#define CHECK(x) do{if(!(x)){fprintf(stderr,"FAIL line %d: %s\n",__LINE__,#x);failures++;}}while(0)

int main(void){
    Date d,a,b; CHECK(parse_date("2024-02-29",&d)); CHECK(!parse_date("2025-02-29",&d)); CHECK(!parse_date("2026-13-01",&d));
    CHECK(parse_date("2026-11-03",&a)&&parse_date("2026-11-10",&b)); CHECK(date_days(b)-date_days(a)==7);
    CHECK(!strcmp(deadline_status(-1),"Closed")); CHECK(!strcmp(deadline_status(0),"Due today")); CHECK(!strcmp(deadline_status(7),"Due soon")); CHECK(!strcmp(deadline_status(8),"Upcoming"));
    const char *csv="id,service,notice_date,deadline_date,action,channel\nA1,Permit renewal,2026-11-01,2026-11-07,Submit form,Online\n";
    FILE *f=tmpfile(); fputs(csv,f); rewind(f); Notice items[4]; size_t n=0; char error[120]; CHECK(read_notices(f,items,&n,error,sizeof error)); CHECK(n==1); fclose(f);
    const char *bad="id,service,notice_date,deadline_date,action,channel\nA1,Test,2026-11-04,2026-11-03,Act,Online\n";
    f=tmpfile(); fputs(bad,f); rewind(f); CHECK(!read_notices(f,items,&n,error,sizeof error)); CHECK(strstr(error,"precedes")!=NULL); fclose(f);
    f=tmpfile(); html_escape(f,"A&B <test>"); rewind(f); char escaped[80]={0}; size_t bytes=fread(escaped,1,sizeof escaped-1,f); CHECK(bytes>0); CHECK(!strcmp(escaped,"A&amp;B &lt;test&gt;")); fclose(f);
    if(failures) return 1;
    puts("All checks passed.");
    return 0;
}
