#ifndef DEADLINE_MAP_H
#define DEADLINE_MAP_H

#include <stddef.h>
#include <stdio.h>

#define MAX_NOTICES 128
#define MAX_FIELD 256

typedef struct { int year, month, day; } Date;
typedef struct {
    char id[40], service[MAX_FIELD], action[MAX_FIELD], channel[80];
    Date notice_date, deadline;
} Notice;

int parse_date(const char *text, Date *out);
long date_days(Date value);
const char *deadline_status(long remaining);
int read_notices(FILE *input, Notice *items, size_t *count, char *error, size_t error_size);
int write_report(FILE *output, Notice *items, size_t count, Date as_of);
void html_escape(FILE *output, const char *text);

#endif
