#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_TEXT 65536
#define MAX_SENTENCES 256
#define MAX_FINDINGS 512
#define MAX_SENTENCE 2048

typedef enum { LONG_SENTENCE, JARGON, ACRONYM } FindingType;

typedef struct {
    FindingType type;
    int sentence_number;
    char evidence[96];
    char suggestion[192];
} Finding;

typedef struct {
    char text[MAX_SENTENCE];
    int words;
} Sentence;

typedef struct {
    Sentence sentences[MAX_SENTENCES];
    int sentence_count;
    Finding findings[MAX_FINDINGS];
    int finding_count;
    int word_count;
} Analysis;

typedef struct { const char *term; const char *suggestion; } JargonRule;

static const JargonRule JARGON_RULES[] = {
    {"utilize", "Consider 'use'."},
    {"commence", "Consider 'start'."},
    {"subsequent to", "Consider 'after'."},
    {"in the event that", "Consider 'if'."},
    {"facilitate", "Name the specific help or action."},
    {"pursuant to", "Name the rule directly, then link to it if needed."}
};

#ifndef PLAIN_LANGUAGE_TEST
static void die(const char *message) { fprintf(stderr, "%s\n", message); exit(1); }
#endif

static void lower_copy(char *destination, const char *source, size_t size) {
    size_t i;
    for (i = 0; source[i] && i + 1 < size; ++i) destination[i] = (char)tolower((unsigned char)source[i]);
    destination[i] = '\0';
}

static int count_words(const char *text) {
    int count = 0, inside = 0;
    for (; *text; ++text) {
        if (isalnum((unsigned char)*text) || *text == '\'') {
            if (!inside) { ++count; inside = 1; }
        } else inside = 0;
    }
    return count;
}

static void add_finding(Analysis *analysis, FindingType type, int sentence, const char *evidence, const char *suggestion) {
    if (analysis->finding_count >= MAX_FINDINGS) return;
    Finding *finding = &analysis->findings[analysis->finding_count++];
    finding->type = type;
    finding->sentence_number = sentence;
    snprintf(finding->evidence, sizeof finding->evidence, "%s", evidence);
    snprintf(finding->suggestion, sizeof finding->suggestion, "%s", suggestion);
}

static int is_acronym(const char *token) {
    int letters = 0;
    for (; *token; ++token) {
        if (isalpha((unsigned char)*token)) {
            if (!isupper((unsigned char)*token)) return 0;
            ++letters;
        } else if (*token != '&' && *token != '-') return 0;
    }
    return letters >= 2;
}

static void analyze_sentence(Analysis *analysis, const char *sentence, int number) {
    char lower[MAX_SENTENCE], copy[MAX_SENTENCE];
    int words = count_words(sentence);
    analysis->sentences[number - 1].words = words;
    snprintf(analysis->sentences[number - 1].text, MAX_SENTENCE, "%s", sentence);
    analysis->word_count += words;
    if (words > 25) {
        char evidence[96];
        snprintf(evidence, sizeof evidence, "%d words", words);
        add_finding(analysis, LONG_SENTENCE, number, evidence, "Consider splitting this sentence or moving conditions into a list.");
    }
    lower_copy(lower, sentence, sizeof lower);
    for (size_t i = 0; i < sizeof JARGON_RULES / sizeof JARGON_RULES[0]; ++i) {
        if (strstr(lower, JARGON_RULES[i].term)) add_finding(analysis, JARGON, number, JARGON_RULES[i].term, JARGON_RULES[i].suggestion);
    }
    snprintf(copy, sizeof copy, "%s", sentence);
    for (char *token = strtok(copy, " \t\r\n,.;:!?()[]\""); token; token = strtok(NULL, " \t\r\n,.;:!?()[]\"")) {
        if (is_acronym(token)) add_finding(analysis, ACRONYM, number, token, "Define this abbreviation on first use if readers may not know it.");
    }
}

static Analysis analyze(const char *text) {
    Analysis analysis = {0};
    char buffer[MAX_SENTENCE];
    size_t length = 0;
    for (size_t i = 0;; ++i) {
        char c = text[i];
        if (length + 1 < sizeof buffer && c != '\0') buffer[length++] = c;
        if (c == '.' || c == '!' || c == '?' || c == '\n' || c == '\0') {
            while (length > 0 && isspace((unsigned char)buffer[length - 1])) --length;
            size_t start = 0;
            while (start < length && isspace((unsigned char)buffer[start])) ++start;
            if (length > start && analysis.sentence_count < MAX_SENTENCES) {
                size_t output_length = length - start;
                memmove(buffer, buffer + start, output_length);
                buffer[output_length] = '\0';
                ++analysis.sentence_count;
                analyze_sentence(&analysis, buffer, analysis.sentence_count);
            }
            length = 0;
        }
        if (c == '\0') break;
    }
    return analysis;
}

static void html_escape(FILE *output, const char *text) {
    for (; *text; ++text) {
        if (*text == '&') fputs("&amp;", output);
        else if (*text == '<') fputs("&lt;", output);
        else if (*text == '>') fputs("&gt;", output);
        else if (*text == '\"') fputs("&quot;", output);
        else fputc(*text, output);
    }
}

static const char *type_name(FindingType type) {
    if (type == LONG_SENTENCE) return "Long sentence";
    if (type == JARGON) return "Administrative wording";
    return "Unexplained abbreviation";
}

static void write_report(FILE *output, const Analysis *analysis) {
    fprintf(output, "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Plain Language Signals</title><style>");
    fputs(":root{--ink:#17201d;--muted:#5c6863;--paper:#f4f1e8;--panel:#fffef9;--line:#d2d7d0;--green:#175f45;--amber:#a44d13}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--paper);font:16px/1.6 system-ui,sans-serif}header,main,footer{width:min(1050px,calc(100% - 2rem));margin:auto}header{padding:4rem 0 2rem;border-bottom:1px solid var(--line)}h1{margin:.2rem 0;font:800 clamp(3rem,8vw,6rem)/.9 Georgia,serif;letter-spacing:-.055em}h2{margin-top:2.8rem}.eyebrow{color:var(--green);font-size:.78rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase}.notice{padding:1rem;background:#e4e9df;border-left:4px solid var(--green)}.metrics{display:flex;gap:1rem;flex-wrap:wrap;margin:1.5rem 0}.metric{min-width:150px;padding:1rem;background:var(--panel);border:1px solid var(--line);border-radius:12px}.metric strong{display:block;font-size:2rem}.finding{display:grid;grid-template-columns:190px 1fr;gap:1rem;padding:1rem 0;border-top:1px solid var(--line)}.tag{width:max-content;height:max-content;padding:.25rem .55rem;color:var(--amber);background:#fae1ce;border-radius:999px;font-size:.75rem;font-weight:800}.sentence-list{padding:0;list-style:none;counter-reset:item}.sentence-list li{position:relative;margin:.8rem 0;padding:1rem 1rem 1rem 3rem;background:var(--panel);border:1px solid var(--line);border-radius:12px}.sentence-list li:before{counter-increment:item;content:counter(item);position:absolute;left:1rem;font-weight:800;color:var(--green)}footer{padding:3rem 0;color:var(--muted)}@media(max-width:650px){.finding{grid-template-columns:1fr}}", output);
    fprintf(output, "</style></head><body><header><p class=\"eyebrow\">Public-service content design</p><h1>Plain Language Signals</h1><p>Review signals for a synthetic service notice—without pretending an automated check can judge comprehension.</p><p class=\"notice\"><strong>Scope:</strong> This report identifies mechanical patterns only. It is not readability certification, accessibility conformance, legal review, or user research.</p></header><main><div class=\"metrics\"><div class=\"metric\"><strong>%d</strong>sentences</div><div class=\"metric\"><strong>%d</strong>words</div><div class=\"metric\"><strong>%d</strong>review signals</div></div>", analysis->sentence_count, analysis->word_count, analysis->finding_count);
    fputs("<section aria-labelledby=\"findings-title\"><h2 id=\"findings-title\">Review signals</h2>", output);
    if (!analysis->finding_count) fputs("<p>No configured signals were found. A human review is still required.</p>", output);
    for (int i = 0; i < analysis->finding_count; ++i) {
        const Finding *finding = &analysis->findings[i];
        fprintf(output, "<article class=\"finding\"><div><span class=\"tag\">%s</span><p>Sentence %d</p></div><div><p><strong>Evidence:</strong> ", type_name(finding->type), finding->sentence_number);
        html_escape(output, finding->evidence);
        fputs("</p><p>", output); html_escape(output, finding->suggestion); fputs("</p></div></article>", output);
    }
    fputs("</section><section aria-labelledby=\"source-title\"><h2 id=\"source-title\">Source text by sentence</h2><ol class=\"sentence-list\">", output);
    for (int i = 0; i < analysis->sentence_count; ++i) {
        fprintf(output, "<li><span class=\"eyebrow\">%d words</span><br>", analysis->sentences[i].words);
        html_escape(output, analysis->sentences[i].text); fputs("</li>", output);
    }
    fputs("</ol></section><section><h2>Recommended next step</h2><p>Rewrite with a content designer, then test the revised notice with representative readers—including people using assistive technology or reading in an additional language.</p></section></main><footer>Designed and built by <strong>Soroush Etemadfar</strong>.</footer></body></html>", output);
}

#ifndef PLAIN_LANGUAGE_TEST
static char *read_file(const char *path) {
    FILE *input = fopen(path, "rb");
    if (!input) return NULL;
    char *text = calloc(MAX_TEXT, 1);
    if (!text) die("Out of memory.");
    size_t length = fread(text, 1, MAX_TEXT - 1, input);
    if (!feof(input)) { fclose(input); free(text); die("Input is too large."); }
    text[length] = '\0'; fclose(input); return text;
}

int main(int argc, char **argv) {
    if (argc != 3) { fprintf(stderr, "Usage: %s input.txt output.html\n", argv[0]); return 2; }
    char *text = read_file(argv[1]);
    if (!text) { fprintf(stderr, "Could not read %s\n", argv[1]); return 1; }
    Analysis analysis = analyze(text);
    if (!analysis.sentence_count) { free(text); fprintf(stderr, "Input contains no sentences.\n"); return 1; }
    FILE *output = fopen(argv[2], "wb");
    if (!output) { free(text); fprintf(stderr, "Could not write %s\n", argv[2]); return 1; }
    write_report(output, &analysis); fclose(output); free(text);
    printf("Wrote %s: %d sentences, %d words, %d review signals.\n", argv[2], analysis.sentence_count, analysis.word_count, analysis.finding_count);
    return 0;
}
#endif
