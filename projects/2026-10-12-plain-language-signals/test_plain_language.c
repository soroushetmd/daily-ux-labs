#define PLAIN_LANGUAGE_TEST
#include "plain_language.c"
#include <assert.h>

static void test_word_count(void) {
    assert(count_words("Apply online today.") == 3);
    assert(count_words("Resident's ID") == 2);
}

static void test_signals(void) {
    Analysis result = analyze("Utilize the portal. Contact the TSC after approval.");
    assert(result.sentence_count == 2);
    assert(result.finding_count == 2);
    assert(result.findings[0].type == JARGON);
    assert(result.findings[1].type == ACRONYM);
}

static void test_long_sentence(void) {
    Analysis result = analyze("One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix.");
    assert(result.finding_count == 1);
    assert(result.findings[0].type == LONG_SENTENCE);
    assert(result.sentences[0].words == 26);
}

static void test_escape(void) {
    FILE *file = tmpfile(); assert(file);
    html_escape(file, "A&B <tag> \"quote\""); rewind(file);
    char buffer[128] = {0};
    size_t bytes = fread(buffer, 1, sizeof buffer - 1, file); fclose(file);
    assert(bytes > 0);
    assert(strcmp(buffer, "A&amp;B &lt;tag&gt; &quot;quote&quot;") == 0);
}

static void test_report_structure(void) {
    Analysis result = analyze("Use the TSC portal.");
    FILE *file = tmpfile(); assert(file); write_report(file, &result); rewind(file);
    char *buffer = calloc(MAX_TEXT, 1); assert(buffer);
    size_t bytes = fread(buffer, 1, MAX_TEXT - 1, file); fclose(file);
    assert(bytes > 0);
    assert(strstr(buffer, "aria-labelledby=\"findings-title\"") != NULL);
    assert(strstr(buffer, "Soroush Etemadfar") != NULL);
    assert(strstr(buffer, "not readability certification") != NULL);
    free(buffer);
}

int main(void) {
    test_word_count(); test_signals(); test_long_sentence(); test_escape(); test_report_structure();
    puts("All 5 tests passed."); return 0;
}
