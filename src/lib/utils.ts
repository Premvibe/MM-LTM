import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseGradeAndSection(grade?: string, section?: string): { classNum: number; section: string } {
  const gStr = (grade || '').trim();
  const sStr = (section || '').trim().toUpperCase();

  const romanMap: Record<string, number> = {
    'XII': 12, 'XI': 11, 'X': 10, 'IX': 9, 'VIII': 8, 'VII': 7, 'VI': 6, 'V': 5, 'IV': 4
  };

  let classNum = 999;
  let detectedSection = sStr;

  // 1. Try Roman numeral matching first (case-insensitive)
  const romanMatch = gStr.match(/^(XII|XI|X|IX|VIII|VII|VI|V|IV)(.*)$/i) || 
                     gStr.match(/\b(XII|XI|X|IX|VIII|VII|VI|V|IV)\b(.*)$/i);
  if (romanMatch) {
    classNum = romanMap[romanMatch[1].toUpperCase()] || 999;
    if (!detectedSection && romanMatch[2]) {
      const rest = romanMatch[2].replace(/class/gi, '').trim();
      const sec = rest.match(/[- ]*\s*([A-Za-z])$/);
      if (sec) detectedSection = sec[1].toUpperCase();
    }
  } else {
    // 2. Try Digit matching, e.g. '6th-A', '7th - C', '6', '8tg'
    const digitMatch = gStr.match(/^(\d+)(.*)$/);
    if (digitMatch) {
      classNum = parseInt(digitMatch[1], 10);
      if (!detectedSection && digitMatch[2]) {
        const rest = digitMatch[2].replace(/(?:th|st|nd|rd|tg|class)/gi, '').trim();
        const sec = rest.match(/[- ]*\s*([A-Za-z])$/);
        if (sec) detectedSection = sec[1].toUpperCase();
      }
    }
  }

  return { classNum, section: detectedSection };
}

export function compareStudentsByClassAndName(
  a: { name?: string; grade?: string; section?: string },
  b: { name?: string; grade?: string; section?: string }
): number {
  const parsedA = parseGradeAndSection(a.grade, a.section);
  const parsedB = parseGradeAndSection(b.grade, b.section);

  if (parsedA.classNum !== parsedB.classNum) {
    return parsedA.classNum - parsedB.classNum;
  }
  const secCompare = parsedA.section.localeCompare(parsedB.section);
  if (secCompare !== 0) {
    return secCompare;
  }
  return (a.name || '').localeCompare(b.name || '');
}

