export const preprocess = (text: string): string => {

    // FIX HYPHENATED LINE BREAKS
    text = text.replace(/-\n/g, '');

    // EXTRA WHITESPACES
    text = text.replace(/ +/g, ' ');

    //2 OR MORE NEW LINES ARE MADE INTO 2 , FOR PARAGRAPHS, JUST 2 ARE NEEDED NOT MORE THAN THAT
    text = text.replace(/\n\n+/g, "\n\n");

    //PAGE NUMBERS
    text = text.replace(/^Page \d+( of \d+)?$|^\d+$/gm, ''); //The m flag makes ^ and $ match start/end of each line, not just the whole string. The ? after ( of \d+) makes that part optional.

    //SPECIAL CHARACTERS
    text = text.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');  // matches all control characters)

    //TRIM
    text = text.trim();

    return text;
}