const PlaygroundLanguage = require('../models/PlaygroundLanguage');
const PlaygroundLab = require('../models/PlaygroundLab');
const PlaygroundProblem = require('../models/PlaygroundProblem');
const PlaygroundProblemLanguage = require('../models/PlaygroundProblemLanguage');
const PlaygroundTestCase = require('../models/PlaygroundTestCase');
const PlaygroundEditorial = require('../models/PlaygroundEditorial');
const PlaygroundSubmission = require('../models/PlaygroundSubmission');
const PlaygroundDiscussion = require('../models/PlaygroundDiscussion');

/**
 * Seed initial real database records if collection is empty
 */
async function seedPlaygroundIfEmpty() {
    try {
        const langCount = await PlaygroundLanguage.countDocuments();
        if (langCount === 0) {
            console.log('Seeding Playground Languages...');
            const languages = [
                {
                    name: 'C',
                    slug: 'c',
                    fullName: 'C Programming',
                    identifier: 'c',
                    version: 'GCC 11.2',
                    fileExtension: '.c',
                    accentColor: '#38BDF8',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    bgGlow: 'rgba(56, 189, 248, 0.12)',
                    badge: 'Procedural',
                    courseCode: '21CS14/24',
                    displayOrder: 1,
                    isActive: true
                },
                {
                    name: 'C++',
                    slug: 'cpp',
                    fullName: 'C++ Object Oriented',
                    identifier: 'cpp',
                    version: 'G++ 11.2',
                    fileExtension: '.cpp',
                    accentColor: '#818CF8',
                    borderColor: 'rgba(129, 140, 248, 0.4)',
                    bgGlow: 'rgba(129, 140, 248, 0.12)',
                    badge: 'OOP & STL',
                    courseCode: '21CS32',
                    displayOrder: 2,
                    isActive: true
                },
                {
                    name: 'Java',
                    slug: 'java',
                    fullName: 'Java Programming',
                    identifier: 'java',
                    version: 'OpenJDK 17',
                    fileExtension: '.java',
                    accentColor: '#F59E0B',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    bgGlow: 'rgba(245, 158, 11, 0.12)',
                    badge: 'Enterprise OOP',
                    courseCode: '21CS44',
                    displayOrder: 3,
                    isActive: true
                },
                {
                    name: 'Python',
                    slug: 'python',
                    fullName: 'Python for Problem Solving',
                    identifier: 'python',
                    version: 'Python 3.10',
                    fileExtension: '.py',
                    accentColor: '#34D399',
                    borderColor: 'rgba(52, 211, 153, 0.4)',
                    bgGlow: 'rgba(52, 211, 153, 0.12)',
                    badge: 'Scripting & AI',
                    courseCode: '21CS25/35',
                    displayOrder: 4,
                    isActive: true
                }
            ];
            await PlaygroundLanguage.insertMany(languages);
        }

        const labCount = await PlaygroundLab.countDocuments();
        if (labCount === 0) {
            console.log('Seeding Playground Initial Lab...');
            const lab1 = await PlaygroundLab.create({
                subjectName: 'Programming for Problem Solving',
                courseCode: '21CS14/24',
                labNumber: 1,
                title: 'Lab 1: Control Structures & Conditional Branching',
                slug: 'lab-1',
                description: 'Basic arithmetic, relational expressions, and nested conditional decision-making in programming.',
                displayOrder: 1,
                isActive: true
            });

            // Single initial problem: Largest of Three Numbers
            const prob1 = await PlaygroundProblem.create({
                labId: lab1._id,
                title: 'Largest of Three Numbers',
                slug: 'largest-of-three-numbers',
                programNumber: 1,
                shortObjective: 'Determine the maximum value among three input integers using conditional logic.',
                description: `Design and execute a program to read three integer numbers \`A\`, \`B\`, and \`C\` and determine the largest among them using conditional statements (\`if-else\` / ternary logic).

Your program should correctly handle cases where some or all numbers are equal, as well as negative integers.`,
                inputFormat: `A single line containing three space-separated integers \`A\`, \`B\`, and \`C\`.`,
                outputFormat: `Print the largest number in the format: \`Largest: <value>\``,
                constraints: [
                    '-10^9 <= A, B, C <= 10^9'
                ],
                examples: [
                    {
                        input: '10 25 15',
                        output: 'Largest: 25',
                        explanation: 'Among 10, 25, and 15, 25 is the greatest.'
                    },
                    {
                        input: '-5 -12 -3',
                        output: 'Largest: -3',
                        explanation: '-3 is closest to zero and thus the largest among negative numbers.'
                    },
                    {
                        input: '40 40 10',
                        output: 'Largest: 40',
                        explanation: 'A and B are equal and both are greater than C.'
                    }
                ],
                difficulty: 'Easy',
                concepts: [
                    'Conditional Statements',
                    'Relational Operators',
                    'Standard I/O'
                ],
                hints: [
                    'Compare A with B and C first. If A >= B and A >= C, then A is the largest.',
                    'Else compare B with C. If B >= C, then B is the largest; otherwise C is the largest.',
                    'Be careful with negative values and numbers that are equal.'
                ],
                displayOrder: 1,
                isActive: true
            });

            // Fetch language IDs for ProblemLanguageConfig
            const cLang = await PlaygroundLanguage.findOne({ slug: 'c' });
            const cppLang = await PlaygroundLanguage.findOne({ slug: 'cpp' });
            const javaLang = await PlaygroundLanguage.findOne({ slug: 'java' });
            const pyLang = await PlaygroundLanguage.findOne({ slug: 'python' });

            const problemConfigs = [
                {
                    problemId: prob1._id,
                    languageId: cLang._id,
                    languageSlug: 'c',
                    starterCode: `#include <stdio.h>

int main() {
    long long a, b, c;

    // Read three space-separated integers
    if (scanf("%lld %lld %lld", &a, &b, &c) != 3) {
        return 0;
    }

    // Determine the largest number
    long long largest;
    if (a >= b && a >= c) {
        largest = a;
    } else if (b >= c) {
        largest = b;
    } else {
        largest = c;
    }

    printf("Largest: %lld\\n", largest);

    return 0;
}`,
                    solutionCode: '',
                    functionSignature: 'int main()'
                },
                {
                    problemId: prob1._id,
                    languageId: cppLang._id,
                    languageSlug: 'cpp',
                    starterCode: `#include <iostream>
using namespace std;

int main() {
    long long a, b, c;
    if (!(cin >> a >> b >> c)) return 0;

    long long largest;
    if (a >= b && a >= c) {
        largest = a;
    } else if (b >= c) {
        largest = b;
    } else {
        largest = c;
    }

    cout << "Largest: " << largest << endl;
    return 0;
}`,
                    solutionCode: '',
                    functionSignature: 'int main()'
                },
                {
                    problemId: prob1._id,
                    languageId: javaLang._id,
                    languageSlug: 'java',
                    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLong()) return;
        long a = sc.nextLong();
        long b = sc.nextLong();
        long c = sc.nextLong();

        long largest;
        if (a >= b && a >= c) {
            largest = a;
        } else if (b >= c) {
            largest = b;
        } else {
            largest = c;
        }

        System.out.println("Largest: " + largest);
    }
}`,
                    solutionCode: '',
                    functionSignature: 'public static void main(String[] args)'
                },
                {
                    problemId: prob1._id,
                    languageId: pyLang._id,
                    languageSlug: 'python',
                    starterCode: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 3:
        return
    a, b, c = map(int, tokens[:3])

    largest = a
    if b >= largest:
        largest = b
    if c >= largest:
        largest = c

    print(f"Largest: {largest}")

if __name__ == '__main__':
    solve()`,
                    solutionCode: '',
                    functionSignature: 'def solve()'
                }
            ];

            await PlaygroundProblemLanguage.insertMany(problemConfigs);

            // Test Cases (Public + Hidden)
            const testCases = [
                {
                    problemId: prob1._id,
                    name: 'Sample Case 1',
                    input: '10 25 15',
                    expectedOutput: 'Largest: 25',
                    isHidden: false,
                    displayOrder: 1
                },
                {
                    problemId: prob1._id,
                    name: 'Sample Case 2',
                    input: '-5 -12 -3',
                    expectedOutput: 'Largest: -3',
                    isHidden: false,
                    displayOrder: 2
                },
                {
                    problemId: prob1._id,
                    name: 'Hidden Case 3 (All Equal)',
                    input: '100 100 100',
                    expectedOutput: 'Largest: 100',
                    isHidden: true,
                    displayOrder: 3
                },
                {
                    problemId: prob1._id,
                    name: 'Hidden Case 4 (Large Numbers)',
                    input: '999999999 1000000000 888888888',
                    expectedOutput: 'Largest: 1000000000',
                    isHidden: true,
                    displayOrder: 4
                },
                {
                    problemId: prob1._id,
                    name: 'Hidden Case 5 (Negative & Zero)',
                    input: '-50 0 -20',
                    expectedOutput: 'Largest: 0',
                    isHidden: true,
                    displayOrder: 5
                }
            ];

            await PlaygroundTestCase.insertMany(testCases);
            console.log('Playground database seeded successfully with "Largest of Three Numbers"');
        }
    } catch (err) {
        console.error('Error seeding playground:', err.message);
    }
}

module.exports = {
    seedPlaygroundIfEmpty
};
