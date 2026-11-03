#include "deadline_map.h"

#include <ctype.h>
#include <stdlib.h>
#include <string.h>

static int leap(int y) { return y % 4 == 0 && (y % 100 != 0 || y % 400 == 0); }

int parse_date(const char *text, Date *out) {
    int y, m, d; char tail;
    static const int mdays[] = {0,31,28,31,30,31,30,31,31,30,31,30,31};
    if (!text || sscanf(text, "%4d-%2d-%2d%c", &y, &m, &d, &tail) != 3 || y < 1 || m < 1 || m > 12) return 0;
    int limit = mdays[m] + (m == 2 && leap(y));
    if (d < 1 || d > limit) return 0;
    out->year = y; out->month = m; out->day = d;
    return 1;
}

long date_days(Date v) {
    int y = v.year - (v.month <= 2);
    int era = (y >= 0 ? y : y - 399) / 400;
    unsigned yoe = (unsigned)(y - era * 400);
    unsigned m = (unsigned)v.month;
    unsigned doy = (153U * (m + (m > 2 ? (unsigned)-3 : 9U)) + 2U) / 5U + (unsigned)v.day - 1U;
    unsigned doe = yoe * 365U + yoe / 4U - yoe / 100U + doy;
    return (long)era * 146097L + (long)doe;
}

const char *deadline_status(long remaining) {
    if (remaining < 0) return "Closed";
    if (remaining == 0) return "Due today";
    if (remaining <= 7) return "Due soon";
    return "Upcoming";
}

static void trim(char *text) {
    char *start = text;
    while (isspace((unsigned char)*start)) start++;
    if (start != text) memmove(text, start, strlen(start) + 1);
    size_t n = strlen(text);
    while (n && isspace((unsigned char)text[n-1])) text[--n] = '\0';
}

static int split_csv(char *line, char *fields[], size_t expected) {
    size_t count = 0; char *read = line; char *write = line;
    while (*read && count < expected) {
        fields[count++] = write;
        int quoted = *read == '"'; if (quoted) read++;
        while (*read) {
            if (quoted && *read == '"' && read[1] == '"') { *write++ = '"'; read += 2; continue; }
            if (quoted && *read == '"') { read++; while (*read == ' ') read++; if (*read == ',') read++; break; }
            if (!quoted && *read == ',') { read++; break; }
            *write++ = *read++;
        }
        *write++ = '\0';
    }
    return count == expected && *read == '\0';
}

int read_notices(FILE *input, Notice *items, size_t *count, char *error, size_t error_size) {
    char line[1200]; size_t used = 0; unsigned row = 0;
    if (!fgets(line, sizeof line, input)) { snprintf(error, error_size, "empty input"); return 0; }
    row++;
    while (fgets(line, sizeof line, input)) {
        row++; trim(line); if (!line[0]) continue;
        if (used == MAX_NOTICES) { snprintf(error, error_size, "too many rows"); return 0; }
        char *f[6];
        if (!split_csv(line, f, 6)) { snprintf(error, error_size, "row %u: expected 6 CSV fields", row); return 0; }
        for (size_t i=0;i<6;i++) trim(f[i]);
        if (!f[0][0] || !f[1][0] || !f[4][0] || !f[5][0]) { snprintf(error,error_size,"row %u: required field is blank",row); return 0; }
        for (size_t i=0;i<used;i++) if (!strcmp(items[i].id,f[0])) { snprintf(error,error_size,"row %u: duplicate id %s",row,f[0]); return 0; }
        Notice *n=&items[used];
        if (strlen(f[0])>=sizeof n->id || strlen(f[1])>=sizeof n->service || strlen(f[4])>=sizeof n->action || strlen(f[5])>=sizeof n->channel) { snprintf(error,error_size,"row %u: field too long",row); return 0; }
        strcpy(n->id,f[0]); strcpy(n->service,f[1]); strcpy(n->action,f[4]); strcpy(n->channel,f[5]);
        if (!parse_date(f[2],&n->notice_date) || !parse_date(f[3],&n->deadline)) { snprintf(error,error_size,"row %u: invalid ISO date",row); return 0; }
        if (date_days(n->deadline)<date_days(n->notice_date)) { snprintf(error,error_size,"row %u: deadline precedes notice",row); return 0; }
        used++;
    }
    *count=used; return 1;
}

void html_escape(FILE *out, const char *s) {
    for (;*s;s++) switch(*s) { case '&': fputs("&amp;",out); break; case '<': fputs("&lt;",out); break; case '>': fputs("&gt;",out); break; case '"': fputs("&quot;",out); break; default: fputc(*s,out); }
}

static int by_deadline(const void *a,const void *b) {
    const Notice *x=a,*y=b; long d=date_days(x->deadline)-date_days(y->deadline); return d<0?-1:d>0?1:strcmp(x->id,y->id);
}

int write_report(FILE *out, Notice *items, size_t count, Date as_of) {
    qsort(items,count,sizeof *items,by_deadline);
    long base=date_days(as_of); size_t closed=0,today=0,soon=0,upcoming=0;
    for(size_t i=0;i<count;i++){ long d=date_days(items[i].deadline)-base; if(d<0)closed++; else if(!d)today++; else if(d<=7)soon++; else upcoming++; }
    fputs("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Deadline Clarity Map</title><style>",out);
    fputs(":root{color-scheme:light;--ink:#17202a;--muted:#52606d;--line:#cbd5e1;--paper:#f8fafc;--accent:#075985}*{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,sans-serif;color:var(--ink);background:var(--paper)}main{max-width:1050px;margin:auto;padding:2rem 1rem 4rem}h1{font-size:clamp(2rem,6vw,4rem);line-height:1;margin:.3rem 0}.lede{max-width:70ch;color:var(--muted)}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.75rem;margin:2rem 0}.metric{background:white;border:1px solid var(--line);border-radius:.75rem;padding:1rem}.metric strong{display:block;font-size:2rem}.table-wrap{overflow:auto;background:white;border:1px solid var(--line);border-radius:.75rem}table{border-collapse:collapse;width:100%;min-width:760px}caption{text-align:left;font-weight:700;padding:1rem}th,td{text-align:left;padding:.8rem;border-top:1px solid var(--line);vertical-align:top}th{background:#e0f2fe}.status{font-weight:700;color:var(--accent)}footer{margin-top:2rem;color:var(--muted)}:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}</style></head><body><main><header><p>Public-service UX prototype</p><h1>Deadline Clarity Map</h1><p class=\"lede\">A chronological view of fictional service notices. Status labels are calculated from the stated as-of date, while original dates and actions remain visible for verification.</p></header>",out);
    fprintf(out,"<section aria-labelledby=\"summary-title\"><h2 id=\"summary-title\">Snapshot as of %04d-%02d-%02d</h2><div class=\"summary\"><div class=\"metric\"><strong>%zu</strong>Closed</div><div class=\"metric\"><strong>%zu</strong>Due today</div><div class=\"metric\"><strong>%zu</strong>Due in 1–7 days</div><div class=\"metric\"><strong>%zu</strong>Upcoming</div></div></section>",as_of.year,as_of.month,as_of.day,closed,today,soon,upcoming);
    fputs("<section aria-labelledby=\"timeline-title\"><h2 id=\"timeline-title\">Deadline timeline</h2><div class=\"table-wrap\"><table><caption>Fictional notices sorted by deadline</caption><thead><tr><th scope=\"col\">Status</th><th scope=\"col\">Deadline</th><th scope=\"col\">Service</th><th scope=\"col\">Required action</th><th scope=\"col\">Channel</th><th scope=\"col\">Notice date</th></tr></thead><tbody>",out);
    for(size_t i=0;i<count;i++){ Notice *n=&items[i]; long d=date_days(n->deadline)-base; fprintf(out,"<tr><td class=\"status\">%s",deadline_status(d)); if(d>0)fprintf(out,"<br><small>%ld day%s left</small>",d,d==1?"":"s"); fprintf(out,"</td><td><time datetime=\"%04d-%02d-%02d\">%04d-%02d-%02d</time></td><td>",n->deadline.year,n->deadline.month,n->deadline.day,n->deadline.year,n->deadline.month,n->deadline.day); html_escape(out,n->service); fputs("</td><td>",out); html_escape(out,n->action); fputs("</td><td>",out); html_escape(out,n->channel); fprintf(out,"</td><td><time datetime=\"%04d-%02d-%02d\">%04d-%02d-%02d</time></td></tr>",n->notice_date.year,n->notice_date.month,n->notice_date.day,n->notice_date.year,n->notice_date.month,n->notice_date.day); }
    fputs("</tbody></table></div></section><footer><p><strong>Interpretation:</strong> “Due soon” means 1–7 calendar days in this prototype. It is a display rule, not policy or legal guidance. Confirm dates with the responsible service.</p><p>Designed and engineered by <strong>Soroush Etemadfar</strong>.</p></footer></main></body></html>",out);
    return ferror(out)==0;
}
