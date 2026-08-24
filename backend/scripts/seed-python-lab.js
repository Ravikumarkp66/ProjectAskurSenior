const mongoose = require('mongoose');
require('dotenv').config();

const PlaygroundLanguage = require('../models/PlaygroundLanguage');
const PlaygroundLab = require('../models/PlaygroundLab');
const PlaygroundProblem = require('../models/PlaygroundProblem');
const PlaygroundProblemLanguage = require('../models/PlaygroundProblemLanguage');
const PlaygroundTestCase = require('../models/PlaygroundTestCase');

const PYTHON_PROBLEMS = [
    {
        labNumber: 1,
        title: 'Distance Between Two Points',
        slug: 'plc6-distance-between-two-points',
        programNumber: 1,
        shortObjective: 'Calculate the Euclidean distance between two points in a 2D plane.',
        description: `Calculate the Euclidean distance between two points in a two-dimensional plane.

Given two points \`(x₁, y₁)\` and \`(x₂, y₂)\`, calculate their distance using the formula:
$$\\text{distance} = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$`,
        inputFormat: `Four real numbers representing \`x1 y1\` on the first line and \`x2 y2\` on the second line (or space-separated on a single line):
\`\`\`
x1 y1
x2 y2
\`\`\``,
        outputFormat: `Print the distance formatted to two decimal places:
\`\`\`
Distance: <value>
\`\`\``,
        constraints: [
            'Coordinates may be positive, negative, or zero.',
            '|coordinate| <= 10^6'
        ],
        examples: [
            {
                input: '0 0\n3 4',
                output: 'Distance: 5.00',
                explanation: 'sqrt((3-0)^2 + (4-0)^2) = sqrt(9 + 16) = sqrt(25) = 5.00'
            },
            {
                input: '1 2\n4 6',
                output: 'Distance: 5.00',
                explanation: 'sqrt((4-1)^2 + (6-2)^2) = sqrt(9 + 16) = 5.00'
            }
        ],
        quiz: {
            question: 'For points (2,3) and (5,7), what is the Euclidean distance?',
            input: '2 3\n5 7',
            expectedOutput: 'Distance: 5.00',
            options: [
                'Distance: 4.00',
                'Distance: 5.00',
                'Distance: 6.00',
                'Distance: 7.00'
            ],
            explanation: 'sqrt((5-2)^2 + (7-3)^2) = sqrt(9 + 16) = sqrt(25) = 5.00'
        },
        difficulty: 'Easy',
        concepts: ['Math Module', 'Euclidean Geometry', 'Floating Point Output'],
        hints: [
            'Read the four coordinates using sys.stdin.read().split().',
            'Calculate dx = x2 - x1 and dy = y2 - y1.',
            'Use math.sqrt(dx**2 + dy**2) or (dx**2 + dy**2)**0.5.',
            'Format the output using f"Distance: {distance:.2f}".'
        ],
        starterCode: `import math
import sys

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 4:
        return
    x1, y1, x2, y2 = map(float, tokens[:4])
    
    distance = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    print(f"Distance: {distance:.2f}")

if __name__ == '__main__':
    solve()`,
        solutionCode: `import math
import sys

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 4:
        return
    x1, y1, x2, y2 = map(float, tokens[:4])
    distance = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    print(f"Distance: {distance:.2f}")

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '0 0\n3 4', expectedOutput: 'Distance: 5.00', isHidden: false },
            { name: 'Sample Case 2', input: '1 2\n4 6', expectedOutput: 'Distance: 5.00', isHidden: false },
            { name: 'Case 3 (Negative Coordinates)', input: '-3 -4\n0 0', expectedOutput: 'Distance: 5.00', isHidden: false },
            { name: 'Case 4 (Origin to Origin)', input: '0 0\n0 0', expectedOutput: 'Distance: 0.00', isHidden: false },
            { name: 'Case 5 (Decimals)', input: '1.5 2.5\n4.5 6.5', expectedOutput: 'Distance: 5.00', isHidden: true },
            { name: 'Case 6 (Large Coordinates)', input: '-10 -10\n10 10', expectedOutput: 'Distance: 28.28', isHidden: true }
        ]
    },
    {
        labNumber: 2,
        title: 'Largest of Three Numbers',
        slug: 'plc6-largest-of-three-numbers',
        programNumber: 2,
        shortObjective: 'Find the largest among three given numbers using if-elif statements.',
        description: `Find the largest among three given numbers using if-elif statements.

Given three numbers \`a\`, \`b\`, and \`c\`, determine and display the largest number.`,
        inputFormat: `Three space-separated numbers on a single line:
\`\`\`
a b c
\`\`\``,
        outputFormat: `Print the largest number:
\`\`\`
Largest: <value>
\`\`\``,
        constraints: [
            '-10^9 <= a, b, c <= 10^9'
        ],
        examples: [
            {
                input: '10 25 15',
                output: 'Largest: 25',
                explanation: '25 is greater than both 10 and 15.'
            },
            {
                input: '-5 -12 -3',
                output: 'Largest: -3',
                explanation: '-3 is the largest among the negative numbers.'
            }
        ],
        quiz: {
            question: 'What is the largest number among 45, 72, and 61?',
            input: '45 72 61',
            expectedOutput: 'Largest: 72',
            options: [
                'Largest: 45',
                'Largest: 61',
                'Largest: 72',
                'Largest: 178'
            ],
            explanation: '72 is the maximum of the three numbers.'
        },
        difficulty: 'Easy',
        concepts: ['Conditional Branching', 'if-elif-else', 'Comparison Operators'],
        hints: [
            'Compare the first number with the other two using if a >= b and a >= c.',
            'Use elif b >= c to check if b is largest.',
            'Otherwise c is largest.'
        ],
        starterCode: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 3:
        return
    a, b, c = map(int, tokens[:3])
    
    if a >= b and a >= c:
        largest = a
    elif b >= c:
        largest = b
    else:
        largest = c
        
    print(f"Largest: {largest}")

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 3:
        return
    a, b, c = map(int, tokens[:3])
    if a >= b and a >= c:
        largest = a
    elif b >= c:
        largest = b
    else:
        largest = c
    print(f"Largest: {largest}")

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '10 25 15', expectedOutput: 'Largest: 25', isHidden: false },
            { name: 'Sample Case 2', input: '-5 -12 -3', expectedOutput: 'Largest: -3', isHidden: false },
            { name: 'Case 3 (All Equal)', input: '5 5 5', expectedOutput: 'Largest: 5', isHidden: false },
            { name: 'Case 4 (First Largest)', input: '100 50 75', expectedOutput: 'Largest: 100', isHidden: true },
            { name: 'Case 5 (All Negative)', input: '-10 -20 -30', expectedOutput: 'Largest: -10', isHidden: true }
        ]
    },
    {
        labNumber: 3,
        title: 'Palindrome and Digit Occurrences',
        slug: 'plc6-palindrome-and-digit-occurrences',
        programNumber: 3,
        shortObjective: 'Determine whether a given number is a palindrome and count digit occurrences.',
        description: `Determine whether a given positive integer is a palindrome and count how many times each digit from 0 to 9 occurs.

Display:
1. \`Palindrome: Yes\` or \`Palindrome: No\`
2. Counts for only the digits that appear in the number, listed in ascending numerical order (\`Digit <d>: <count>\`).`,
        inputFormat: `A single line containing a positive integer:
\`\`\`
number
\`\`\``,
        outputFormat: `\`\`\`
Palindrome: Yes/No
Digit <d>: <count>
...
\`\`\``,
        constraints: [
            'Input is a non-negative integer.',
            'Maximum digits: 1000'
        ],
        examples: [
            {
                input: '12121',
                output: 'Palindrome: Yes\nDigit 1: 3\nDigit 2: 2',
                explanation: '12121 reads the same backward. Digit 1 appears 3 times, digit 2 appears 2 times.'
            },
            {
                input: '12345',
                output: 'Palindrome: No\nDigit 1: 1\nDigit 2: 1\nDigit 3: 1\nDigit 4: 1\nDigit 5: 1',
                explanation: '12345 is not a palindrome.'
            }
        ],
        quiz: {
            question: 'Is 1221 a palindrome?',
            input: '1221',
            expectedOutput: 'Palindrome: Yes\nDigit 1: 2\nDigit 2: 2',
            options: [
                'Palindrome: Yes\nDigit 1: 2\nDigit 2: 2',
                'Palindrome: No\nDigit 1: 2\nDigit 2: 2',
                'Palindrome: Yes\nDigit 1: 1\nDigit 2: 1',
                'Palindrome: No\nDigit 1: 4'
            ],
            explanation: '1221 reversed is 1221, so it is a palindrome.'
        },
        difficulty: 'Easy',
        concepts: ['String Slicing', 'Dictionaries / Frequency Counting', 'Loops'],
        hints: [
            'Convert the number to a string s.',
            'Check palindrome using s == s[::-1].',
            'Count digit frequencies for each d in "0123456789" using s.count(d).'
        ],
        starterCode: `import sys

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
        
    is_palindrome = "Yes" if s == s[::-1] else "No"
    print(f"Palindrome: {is_palindrome}")
    
    for digit in range(10):
        c = s.count(str(digit))
        if c > 0:
            print(f"Digit {digit}: {c}")

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
    is_palindrome = "Yes" if s == s[::-1] else "No"
    print(f"Palindrome: {is_palindrome}")
    for digit in range(10):
        c = s.count(str(digit))
        if c > 0:
            print(f"Digit {digit}: {c}")

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '12121', expectedOutput: 'Palindrome: Yes\nDigit 1: 3\nDigit 2: 2', isHidden: false },
            { name: 'Sample Case 2', input: '12345', expectedOutput: 'Palindrome: No\nDigit 1: 1\nDigit 2: 1\nDigit 3: 1\nDigit 4: 1\nDigit 5: 1', isHidden: false },
            { name: 'Case 3', input: '1221', expectedOutput: 'Palindrome: Yes\nDigit 1: 2\nDigit 2: 2', isHidden: false },
            { name: 'Case 4 (With Zero)', input: '1001', expectedOutput: 'Palindrome: Yes\nDigit 0: 2\nDigit 1: 2', isHidden: true },
            { name: 'Case 5', input: '123321', expectedOutput: 'Palindrome: Yes\nDigit 1: 2\nDigit 2: 2\nDigit 3: 2', isHidden: true },
            { name: 'Case 6', input: '1112233', expectedOutput: 'Palindrome: No\nDigit 1: 3\nDigit 2: 2\nDigit 3: 2', isHidden: true }
        ]
    },
    {
        labNumber: 4,
        title: 'Fibonacci Sequence Using Function',
        slug: 'plc6-fibonacci-sequence-using-function',
        programNumber: 4,
        shortObjective: 'Generate the Fibonacci sequence using a function.',
        description: `Generate the Fibonacci sequence using a function.

The Fibonacci sequence is:
\`0, 1, 1, 2, 3, 5, 8, ...\`
where \`F_n = F_{n-1} + F_{n-2}\` with \`F_1 = 0, F_2 = 1\`.

Write a Python program that accepts \`N\` and passes it to a function to generate the first \`N\` terms of the Fibonacci sequence.
If \`N <= 0\`, display \`Invalid input\`.`,
        inputFormat: `An integer \`N\` on a single line:
\`\`\`
N
\`\`\``,
        outputFormat: `For valid input (\`N > 0\`):
\`\`\`
Fibonacci: <terms separated by space>
\`\`\`
For invalid input (\`N <= 0\`):
\`\`\`
Invalid input
\`\`\``,
        constraints: [
            'N is an integer'
        ],
        examples: [
            {
                input: '7',
                output: 'Fibonacci: 0 1 1 2 3 5 8',
                explanation: 'The first 7 terms of the Fibonacci sequence.'
            },
            {
                input: '1',
                output: 'Fibonacci: 0',
                explanation: 'The first term is 0.'
            }
        ],
        quiz: {
            question: 'What is the Fibonacci sequence for N = 6?',
            input: '6',
            expectedOutput: 'Fibonacci: 0 1 1 2 3 5',
            options: [
                'Fibonacci: 0 1 1 2 3 5',
                'Fibonacci: 1 1 2 3 5 8',
                'Fibonacci: 0 1 2 3 4 5',
                'Fibonacci: 1 2 3 5 8 13'
            ],
            explanation: 'First 6 terms: 0, 1, 1, 2, 3, 5'
        },
        difficulty: 'Easy',
        concepts: ['Functions', 'Fibonacci Series', 'Input Validation'],
        hints: [
            'If N <= 0, print "Invalid input".',
            'If N == 1, return [0].',
            'If N == 2, return [0, 1].',
            'For N > 2, append the sum of the last two elements.'
        ],
        starterCode: `import sys

def generate_fibonacci(n):
    if n <= 0:
        return None
    if n == 1:
        return [0]
    fib = [0, 1]
    while len(fib) < n:
        fib.append(fib[-1] + fib[-2])
    return fib

def solve():
    line = sys.stdin.read().strip()
    if not line:
        return
    n = int(line)
    res = generate_fibonacci(n)
    if res is None:
        print("Invalid input")
    else:
        print("Fibonacci: " + " ".join(map(str, res)))

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

def generate_fibonacci(n):
    if n <= 0:
        return None
    if n == 1:
        return [0]
    fib = [0, 1]
    while len(fib) < n:
        fib.append(fib[-1] + fib[-2])
    return fib

def solve():
    line = sys.stdin.read().strip()
    if not line:
        return
    n = int(line)
    res = generate_fibonacci(n)
    if res is None:
        print("Invalid input")
    else:
        print("Fibonacci: " + " ".join(map(str, res)))

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '7', expectedOutput: 'Fibonacci: 0 1 1 2 3 5 8', isHidden: false },
            { name: 'Sample Case 2', input: '1', expectedOutput: 'Fibonacci: 0', isHidden: false },
            { name: 'Case 3 (N = 2)', input: '2', expectedOutput: 'Fibonacci: 0 1', isHidden: false },
            { name: 'Case 4 (N = 5)', input: '5', expectedOutput: 'Fibonacci: 0 1 1 2 3', isHidden: false },
            { name: 'Case 5 (N = 10)', input: '10', expectedOutput: 'Fibonacci: 0 1 1 2 3 5 8 13 21 34', isHidden: true },
            { name: 'Case 6 (Invalid N = 0)', input: '0', expectedOutput: 'Invalid input', isHidden: true },
            { name: 'Case 7 (Invalid N < 0)', input: '-5', expectedOutput: 'Invalid input', isHidden: true }
        ]
    },
    {
        labNumber: 5,
        title: 'GCD Using Function',
        slug: 'plc6-gcd-using-function',
        programNumber: 5,
        shortObjective: 'Calculate the GCD of two numbers using a function.',
        description: `Calculate the Greatest Common Divisor (GCD) of two numbers using a function with arguments and a return value using the Euclidean algorithm.`,
        inputFormat: `Two space-separated integers on a single line:
\`\`\`
a b
\`\`\``,
        outputFormat: `Print the GCD:
\`\`\`
GCD: <value>
\`\`\``,
        constraints: [
            '1 <= a, b <= 10^9'
        ],
        examples: [
            {
                input: '48 18',
                output: 'GCD: 6',
                explanation: 'Factors of 48: 1, 2, 3, 4, 6, 8, 12, 16, 24, 48. Factors of 18: 1, 2, 3, 6, 9, 18. Greatest common factor is 6.'
            },
            {
                input: '100 25',
                output: 'GCD: 25',
                explanation: '25 divides both 100 and 25.'
            }
        ],
        quiz: {
            question: 'What is the GCD of 36 and 24?',
            input: '36 24',
            expectedOutput: 'GCD: 12',
            options: [
                'GCD: 6',
                'GCD: 12',
                'GCD: 18',
                'GCD: 24'
            ],
            explanation: 'GCD(36, 24) = 12'
        },
        difficulty: 'Easy',
        concepts: ['Euclidean Algorithm', 'Recursion / Iteration', 'Functions'],
        hints: [
            'Use Euclidean algorithm: while b != 0: a, b = b, a % b',
            'Return a when b becomes 0.'
        ],
        starterCode: `import sys

def compute_gcd(a, b):
    while b:
        a, b = b, a % b
    return a

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 2:
        return
    a, b = map(int, tokens[:2])
    result = compute_gcd(a, b)
    print(f"GCD: {result}")

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

def compute_gcd(a, b):
    while b:
        a, b = b, a % b
    return a

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 2:
        return
    a, b = map(int, tokens[:2])
    print(f"GCD: {compute_gcd(a, b)}")

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '48 18', expectedOutput: 'GCD: 6', isHidden: false },
            { name: 'Sample Case 2', input: '100 25', expectedOutput: 'GCD: 25', isHidden: false },
            { name: 'Case 3', input: '36 24', expectedOutput: 'GCD: 12', isHidden: false },
            { name: 'Case 4 (Co-prime)', input: '17 13', expectedOutput: 'GCD: 1', isHidden: true },
            { name: 'Case 5 (Equal Numbers)', input: '100 100', expectedOutput: 'GCD: 100', isHidden: true }
        ]
    },
    {
        labNumber: 6,
        title: 'Selection Sort',
        slug: 'plc6-selection-sort',
        programNumber: 6,
        shortObjective: 'Sort a list using the Selection Sort algorithm.',
        description: `Sort a given list of \`N\` integers in ascending order using the Selection Sort algorithm.

In each iteration, find the minimum element in the unsorted portion of the array and swap it with the element at the beginning of the unsorted portion.`,
        inputFormat: `Line 1: An integer \`N\`
Line 2: \`N\` space-separated integers
\`\`\`
N
element1 element2 ... elementN
\`\`\``,
        outputFormat: `Print the sorted list elements separated by a space:
\`\`\`
Sorted list: <elements>
\`\`\``,
        constraints: [
            '1 <= N <= 1000',
            '-10^6 <= element <= 10^6'
        ],
        examples: [
            {
                input: '5\n64 25 12 22 11',
                output: 'Sorted list: 11 12 22 25 64',
                explanation: 'Selection sort sorts the list in ascending order.'
            },
            {
                input: '5\n5 4 3 2 1',
                output: 'Sorted list: 1 2 3 4 5',
                explanation: 'Reverses descending array into ascending order.'
            }
        ],
        quiz: {
            question: 'What is the sorted result for: 8 3 7 1 4?',
            input: '5\n8 3 7 1 4',
            expectedOutput: 'Sorted list: 1 3 4 7 8',
            options: [
                'Sorted list: 1 3 4 7 8',
                'Sorted list: 8 7 4 3 1',
                'Sorted list: 3 1 7 4 8',
                'Sorted list: 1 4 3 7 8'
            ],
            explanation: 'Ascending sorted order is 1 3 4 7 8.'
        },
        difficulty: 'Medium',
        concepts: ['Selection Sort', 'Array Manipulation', 'Nested Loops'],
        hints: [
            'Iterate index i from 0 to N-1.',
            'Find min_idx = min(range(i, N), key=lambda k: arr[k]).',
            'Swap arr[i] and arr[min_idx].'
        ],
        starterCode: `import sys

def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    arr = list(map(int, tokens[1:n+1]))
    sorted_arr = selection_sort(arr)
    print("Sorted list: " + " ".join(map(str, sorted_arr)))

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    arr = list(map(int, tokens[1:n+1]))
    sorted_arr = selection_sort(arr)
    print("Sorted list: " + " ".join(map(str, sorted_arr)))

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '5\n64 25 12 22 11', expectedOutput: 'Sorted list: 11 12 22 25 64', isHidden: false },
            { name: 'Sample Case 2', input: '5\n5 4 3 2 1', expectedOutput: 'Sorted list: 1 2 3 4 5', isHidden: false },
            { name: 'Case 3 (Already Sorted)', input: '5\n1 2 3 4 5', expectedOutput: 'Sorted list: 1 2 3 4 5', isHidden: false },
            { name: 'Case 4 (Duplicates)', input: '5\n4 1 4 2 3', expectedOutput: 'Sorted list: 1 2 3 4 4', isHidden: true },
            { name: 'Case 5 (Negatives and Zero)', input: '5\n10 -2 5 0 -8', expectedOutput: 'Sorted list: -8 -2 0 5 10', isHidden: true }
        ]
    },
    {
        labNumber: 7,
        title: 'Binary Search',
        slug: 'plc6-binary-search',
        programNumber: 7,
        shortObjective: 'Search for an element in a sorted list using Binary Search.',
        description: `Search for an element in a sorted list using the Binary Search algorithm.

Given \`N\`, a sorted list of \`N\` integers, and a search key \`key\`, determine whether the key exists in the list and display its 0-based index. If not found, display \`Element not found\`.`,
        inputFormat: `Line 1: N
Line 2: N space-separated sorted integers
Line 3: Search key
\`\`\`
N
element1 element2 ... elementN
key
\`\`\``,
        outputFormat: `If key is found:
\`\`\`
Element found at position: <0-based position>
\`\`\`
If key is not found:
\`\`\`
Element not found
\`\`\``,
        constraints: [
            '1 <= N <= 10000',
            'Input list is strictly sorted in ascending order.'
        ],
        examples: [
            {
                input: '5\n10 20 30 40 50\n30',
                output: 'Element found at position: 2',
                explanation: '30 is at index 2 in 0-based indexing.'
            },
            {
                input: '5\n10 20 30 40 50\n35',
                output: 'Element not found',
                explanation: '35 does not exist in the list.'
            }
        ],
        quiz: {
            question: 'In the sorted array [10, 20, 30, 40, 50], at what 0-based index is 40 located?',
            input: '5\n10 20 30 40 50\n40',
            expectedOutput: 'Element found at position: 3',
            options: [
                'Element found at position: 2',
                'Element found at position: 3',
                'Element found at position: 4',
                'Element not found'
            ],
            explanation: '40 is located at index 3.'
        },
        difficulty: 'Medium',
        concepts: ['Binary Search', 'Divide and Conquer', 'Search Algorithms'],
        hints: [
            'Initialize low = 0, high = N - 1.',
            'While low <= high: mid = (low + high) // 2.',
            'If arr[mid] == key, return mid. If arr[mid] < key, low = mid + 1; else high = mid - 1.',
            'Return -1 if not found.'
        ],
        starterCode: `import sys

def binary_search(arr, key):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == key:
            return mid
        elif arr[mid] < key:
            low = mid + 1
        else:
            high = mid - 1
    return -1

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    arr = list(map(int, tokens[1:n+1]))
    key = int(tokens[n+1])
    
    pos = binary_search(arr, key)
    if pos != -1:
        print(f"Element found at position: {pos}")
    else:
        print("Element not found")

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

def binary_search(arr, key):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == key:
            return mid
        elif arr[mid] < key:
            low = mid + 1
        else:
            high = mid - 1
    return -1

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    arr = list(map(int, tokens[1:n+1]))
    key = int(tokens[n+1])
    pos = binary_search(arr, key)
    if pos != -1:
        print(f"Element found at position: {pos}")
    else:
        print("Element not found")

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '5\n10 20 30 40 50\n30', expectedOutput: 'Element found at position: 2', isHidden: false },
            { name: 'Sample Case 2', input: '5\n10 20 30 40 50\n35', expectedOutput: 'Element not found', isHidden: false },
            { name: 'Case 3 (First Element)', input: '5\n10 20 30 40 50\n10', expectedOutput: 'Element found at position: 0', isHidden: false },
            { name: 'Case 4 (Last Element)', input: '5\n10 20 30 40 50\n50', expectedOutput: 'Element found at position: 4', isHidden: true },
            { name: 'Case 5 (Single Element Found)', input: '1\n42\n42', expectedOutput: 'Element found at position: 0', isHidden: true },
            { name: 'Case 6 (Single Element Not Found)', input: '1\n42\n99', expectedOutput: 'Element not found', isHidden: true }
        ]
    },
    {
        labNumber: 8,
        title: 'Sentence Analysis',
        slug: 'plc6-sentence-analysis',
        programNumber: 8,
        shortObjective: 'Count words, digits, uppercase, and lowercase characters without built-ins.',
        description: `Analyze a sentence and count:
- Number of words
- Number of digits
- Number of uppercase letters
- Number of lowercase letters

**Constraint:** Perform character checking manually using character ranges (e.g., \`'A' <= ch <= 'Z'\`, \`'a' <= ch <= 'z'\`, \`'0' <= ch <= '9'\`) without relying on built-in predicates like \`isupper()\`, \`islower()\`, or \`isdigit()\`.`,
        inputFormat: `A single line containing a sentence:
\`\`\`
sentence
\`\`\``,
        outputFormat: `\`\`\`
Words: <count>
Digits: <count>
Uppercase: <count>
Lowercase: <count>
\`\`\``,
        constraints: [
            'Sentence length <= 1000 characters.'
        ],
        examples: [
            {
                input: 'Hello World 123',
                output: 'Words: 3\nDigits: 3\nUppercase: 2\nLowercase: 8',
                explanation: '3 words (Hello, World, 123), 3 digits (1, 2, 3), 2 uppercase (H, W), 8 lowercase.'
            },
            {
                input: 'Python Lab 2026',
                output: 'Words: 3\nDigits: 4\nUppercase: 2\nLowercase: 7',
                explanation: 'Words: 3, Digits: 4 (2026), Uppercase: 2 (P, L), Lowercase: 7 (ython, ab).'
            }
        ],
        quiz: {
            question: 'For "Hello 123", how many uppercase letters are there?',
            input: 'Hello 123',
            expectedOutput: 'Words: 2\nDigits: 3\nUppercase: 1\nLowercase: 4',
            options: [
                'Words: 2\nDigits: 3\nUppercase: 1\nLowercase: 4',
                'Words: 2\nDigits: 3\nUppercase: 2\nLowercase: 4',
                'Words: 1\nDigits: 3\nUppercase: 1\nLowercase: 4',
                'Words: 2\nDigits: 0\nUppercase: 1\nLowercase: 4'
            ],
            explanation: '"Hello 123" has 1 uppercase letter ("H").'
        },
        difficulty: 'Medium',
        concepts: ['Character Codes / Ranges', 'String Parsing', 'Manual Validation'],
        hints: [
            'Words can be counted by splitting by whitespace: len(sentence.split()).',
            'Iterate through every character ch in the sentence.',
            "Check 'A' <= ch <= 'Z' for uppercase.",
            "Check 'a' <= ch <= 'z' for lowercase.",
            "Check '0' <= ch <= '9' for digits."
        ],
        starterCode: `import sys

def analyze_sentence(s):
    words = len(s.split())
    digits = 0
    upper = 0
    lower = 0
    
    for ch in s:
        if '0' <= ch <= '9':
            digits += 1
        elif 'A' <= ch <= 'Z':
            upper += 1
        elif 'a' <= ch <= 'z':
            lower += 1
            
    print(f"Words: {words}")
    print(f"Digits: {digits}")
    print(f"Uppercase: {upper}")
    print(f"Lowercase: {lower}")

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
    analyze_sentence(s)

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

def analyze_sentence(s):
    words = len(s.split())
    digits = 0
    upper = 0
    lower = 0
    for ch in s:
        if '0' <= ch <= '9':
            digits += 1
        elif 'A' <= ch <= 'Z':
            upper += 1
        elif 'a' <= ch <= 'z':
            lower += 1
    print(f"Words: {words}")
    print(f"Digits: {digits}")
    print(f"Uppercase: {upper}")
    print(f"Lowercase: {lower}")

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
    analyze_sentence(s)

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: 'Hello World 123', expectedOutput: 'Words: 3\nDigits: 3\nUppercase: 2\nLowercase: 8', isHidden: false },
            { name: 'Sample Case 2', input: 'Python Lab 2026', expectedOutput: 'Words: 3\nDigits: 4\nUppercase: 2\nLowercase: 7', isHidden: false },
            { name: 'Case 3', input: 'Hello 123', expectedOutput: 'Words: 2\nDigits: 3\nUppercase: 1\nLowercase: 4', isHidden: false },
            { name: 'Case 4 (Only Letters)', input: 'OnlyLetters', expectedOutput: 'Words: 1\nDigits: 0\nUppercase: 2\nLowercase: 9', isHidden: true },
            { name: 'Case 5 (All Upper)', input: 'ALL UPPER 999', expectedOutput: 'Words: 3\nDigits: 3\nUppercase: 8\nLowercase: 0', isHidden: true }
        ]
    },
    {
        labNumber: 9,
        title: 'Roman Number to Integer',
        slug: 'plc6-roman-number-to-integer',
        programNumber: 9,
        shortObjective: 'Convert a Roman numeral into its corresponding integer using a dictionary.',
        description: `Convert a Roman numeral into its corresponding integer value using a dictionary.

Standard Roman numeral mapping:
- \`I = 1\`
- \`V = 5\`
- \`X = 10\`
- \`L = 50\`
- \`C = 100\`
- \`D = 500\`
- \`M = 1000\`

When a smaller numeral comes before a larger numeral, subtract it; otherwise, add it.`,
        inputFormat: `A valid Roman numeral on a single line:
\`\`\`
Roman numeral
\`\`\``,
        outputFormat: `Print the converted integer:
\`\`\`
Integer: <value>
\`\`\``,
        constraints: [
            'Input is a valid Roman numeral.',
            'Value between 1 and 3999.'
        ],
        examples: [
            {
                input: 'XIV',
                output: 'Integer: 14',
                explanation: 'X(10) + IV(4) = 14'
            },
            {
                input: 'MCMXC',
                output: 'Integer: 1990',
                explanation: 'M(1000) + CM(900) + XC(90) = 1990'
            }
        ],
        quiz: {
            question: 'What is the integer value of Roman numeral XL?',
            input: 'XL',
            expectedOutput: 'Integer: 40',
            options: [
                'Integer: 40',
                'Integer: 60',
                'Integer: 50',
                'Integer: 45'
            ],
            explanation: 'X (10) before L (50) means 50 - 10 = 40.'
        },
        difficulty: 'Medium',
        concepts: ['Dictionaries / Hash Maps', 'Roman Numerals', 'Iterative Parsing'],
        hints: [
            "Map roman characters: {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}.",
            'Traverse the string from left to right.',
            'If roman[s[i]] < roman[s[i+1]], subtract roman[s[i]]; else add roman[s[i]].'
        ],
        starterCode: `import sys

def roman_to_int(s):
    roman = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    total = 0
    n = len(s)
    for i in range(n):
        val = roman[s[i]]
        if i + 1 < n and val < roman[s[i + 1]]:
            total -= val
        else:
            total += val
    return total

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
    print(f"Integer: {roman_to_int(s)}")

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

def roman_to_int(s):
    roman = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    total = 0
    n = len(s)
    for i in range(n):
        val = roman[s[i]]
        if i + 1 < n and val < roman[s[i + 1]]:
            total -= val
        else:
            total += val
    return total

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
    print(f"Integer: {roman_to_int(s)}")

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: 'XIV', expectedOutput: 'Integer: 14', isHidden: false },
            { name: 'Sample Case 2', input: 'MCMXC', expectedOutput: 'Integer: 1990', isHidden: false },
            { name: 'Case 3', input: 'III', expectedOutput: 'Integer: 3', isHidden: false },
            { name: 'Case 4', input: 'IX', expectedOutput: 'Integer: 9', isHidden: false },
            { name: 'Case 5', input: 'XL', expectedOutput: 'Integer: 40', isHidden: true },
            { name: 'Case 6', input: 'MMXXVI', expectedOutput: 'Integer: 2026', isHidden: true }
        ]
    },
    {
        labNumber: 10,
        title: 'Binary String Check',
        slug: 'plc6-binary-string-check',
        programNumber: 10,
        shortObjective: 'Determine whether a given string contains only binary digits.',
        description: `Determine whether a given string contains only binary digits (\`0\` and \`1\`).

If every character is either \`0\` or \`1\`, print \`Yes\`. Otherwise, print \`No\`.`,
        inputFormat: `A string on a single line:
\`\`\`
string
\`\`\``,
        outputFormat: `\`\`\`
Yes
or
No
\`\`\``,
        constraints: [
            'String length <= 1000'
        ],
        examples: [
            {
                input: '01010101010',
                output: 'Yes',
                explanation: 'All characters are 0 or 1.'
            },
            {
                input: 'geeks101',
                output: 'No',
                explanation: 'Contains non-binary characters (g, e, k, s).'
            }
        ],
        quiz: {
            question: 'Is 1011001 a binary string?',
            input: '1011001',
            expectedOutput: 'Yes',
            options: [
                'Yes',
                'No'
            ],
            explanation: 'All digits are 0 and 1, so it is a binary string.'
        },
        difficulty: 'Easy',
        concepts: ['String Validation', 'Set Operations / Loop Checking'],
        hints: [
            'Check set(s).issubset({"0", "1"}) or all(ch in "01" for ch in s).'
        ],
        starterCode: `import sys

def is_binary(s):
    return all(ch in '01' for ch in s)

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
    print("Yes" if is_binary(s) else "No")

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

def is_binary(s):
    return all(ch in '01' for ch in s)

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
    print("Yes" if is_binary(s) else "No")

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '01010101010', expectedOutput: 'Yes', isHidden: false },
            { name: 'Sample Case 2', input: 'geeks101', expectedOutput: 'No', isHidden: false },
            { name: 'Case 3', input: '010101', expectedOutput: 'Yes', isHidden: false },
            { name: 'Case 4', input: '111111', expectedOutput: 'Yes', isHidden: false },
            { name: 'Case 5', input: '00000', expectedOutput: 'Yes', isHidden: true },
            { name: 'Case 6', input: '101201', expectedOutput: 'No', isHidden: true }
        ]
    },
    {
        labNumber: 11,
        title: 'Alphanumeric / Special Characters',
        slug: 'plc6-alphanumeric-special-characters',
        programNumber: 11,
        shortObjective: 'Determine whether a string contains only alphanumeric or special characters.',
        description: `Given a string, determine whether it contains strictly alphanumeric characters (letters and digits only) or contains special characters.

Note: Whitespace and punctuation symbols are considered special characters.`,
        inputFormat: `A single line containing a string:
\`\`\`
string
\`\`\``,
        outputFormat: `Print either:
\`\`\`
String contains only alphanumeric characters.
\`\`\`
or
\`\`\`
String contains special characters.
\`\`\``,
        constraints: [
            'String length <= 1000'
        ],
        examples: [
            {
                input: 'Geeks$For$Geeks',
                output: 'String contains special characters.',
                explanation: 'The string contains the special character $.'
            },
            {
                input: 'Geeks123',
                output: 'String contains only alphanumeric characters.',
                explanation: 'All characters are either English letters or digits.'
            }
        ],
        quiz: {
            question: 'What is the result for "Hello@123"?',
            input: 'Hello@123',
            expectedOutput: 'String contains special characters.',
            options: [
                'String contains special characters.',
                'String contains only alphanumeric characters.'
            ],
            explanation: '@ is a special character.'
        },
        difficulty: 'Easy',
        concepts: ['Character Checking', 'Alphanumeric Validation'],
        hints: [
            'Check each character using ("A" <= ch <= "Z" or "a" <= ch <= "z" or "0" <= ch <= "9").',
            'If all characters satisfy the condition, print alphanumeric message, else special characters message.'
        ],
        starterCode: `import sys

def check_alphanumeric(s):
    for ch in s:
        is_alnum = ('A' <= ch <= 'Z') or ('a' <= ch <= 'z') or ('0' <= ch <= '9')
        if not is_alnum:
            return False
    return True

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
    if check_alphanumeric(s):
        print("String contains only alphanumeric characters.")
    else:
        print("String contains special characters.")

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

def check_alphanumeric(s):
    for ch in s:
        is_alnum = ('A' <= ch <= 'Z') or ('a' <= ch <= 'z') or ('0' <= ch <= '9')
        if not is_alnum:
            return False
    return True

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
    if check_alphanumeric(s):
        print("String contains only alphanumeric characters.")
    else:
        print("String contains special characters.")

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: 'Geeks$For$Geeks', expectedOutput: 'String contains special characters.', isHidden: false },
            { name: 'Sample Case 2', input: 'Geeks123', expectedOutput: 'String contains only alphanumeric characters.', isHidden: false },
            { name: 'Case 3', input: 'HelloWorld', expectedOutput: 'String contains only alphanumeric characters.', isHidden: false },
            { name: 'Case 4 (With Space)', input: 'Hello World', expectedOutput: 'String contains special characters.', isHidden: true },
            { name: 'Case 5', input: 'ABC123!', expectedOutput: 'String contains special characters.', isHidden: true }
        ]
    },
    {
        labNumber: 12,
        title: 'Employee Class',
        slug: 'plc6-employee-class',
        programNumber: 12,
        shortObjective: 'Create an Employee class and update salaries based on department.',
        description: `Create an \`Employee\` class to store employee details and update salaries based on department.

Class Attributes:
- \`name\`
- \`emp_id\`
- \`department\`
- \`salary\`

Implement a method to update the salary for all employees belonging to a specified target department.`,
        inputFormat: `Line 1: An integer \`N\` (number of employees)
Next \`N\` lines: \`Name ID Department Salary\`
Next line: Target Department
Next line: Updated Salary
\`\`\`
N
Name1 ID1 Dept1 Salary1
...
TargetDepartment
NewSalary
\`\`\``,
        outputFormat: `Print each employee's details on a separate line:
\`\`\`
Name ID Department Salary
\`\`\``,
        constraints: [
            '1 <= N <= 1000',
            'Salary is a positive integer'
        ],
        examples: [
            {
                input: '3\nAlice 101 HR 30000\nBob 102 IT 50000\nCharlie 103 IT 45000\nIT\n55000',
                output: 'Alice 101 HR 30000\nBob 102 IT 55000\nCharlie 103 IT 55000',
                explanation: 'Bob and Charlie belong to the IT department, so their salaries are updated to 55000.'
            }
        ],
        quiz: {
            question: 'If two employees belong to IT, which employees should have their salary changed when IT is selected?',
            input: '2\nBob 102 IT 50000\nCharlie 103 IT 45000\nIT\n55000',
            expectedOutput: 'Bob 102 IT 55000\nCharlie 103 IT 55000',
            options: [
                'Bob 102 IT 55000\nCharlie 103 IT 55000',
                'Bob 102 IT 50000\nCharlie 103 IT 45000',
                'Bob 102 IT 55000\nCharlie 103 IT 45000',
                'Bob 102 IT 50000\nCharlie 103 IT 55000'
            ],
            explanation: 'Both IT employees will have their salary updated to 55000.'
        },
        difficulty: 'Medium',
        concepts: ['Object Oriented Programming', 'Classes and Objects', 'Methods'],
        hints: [
            'Define class Employee with __init__(self, name, emp_id, dept, salary).',
            'Add method update_salary(self, target_dept, new_salary).',
            'Iterate through employees and call the update method.'
        ],
        starterCode: `import sys

class Employee:
    def __init__(self, name, emp_id, department, salary):
        self.name = name
        self.emp_id = emp_id
        self.department = department
        self.salary = salary

    def update_salary(self, target_dept, new_salary):
        if self.department == target_dept:
            self.salary = new_salary

    def display(self):
        print(f"{self.name} {self.emp_id} {self.department} {self.salary}")

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    idx = 1
    employees = []
    for _ in range(n):
        name = tokens[idx]
        emp_id = tokens[idx + 1]
        dept = tokens[idx + 2]
        sal = int(tokens[idx + 3])
        employees.append(Employee(name, emp_id, dept, sal))
        idx += 4
    
    target_dept = tokens[idx]
    new_sal = int(tokens[idx + 1])
    
    for emp in employees:
        emp.update_salary(target_dept, new_sal)
        emp.display()

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

class Employee:
    def __init__(self, name, emp_id, department, salary):
        self.name = name
        self.emp_id = emp_id
        self.department = department
        self.salary = salary

    def update_salary(self, target_dept, new_salary):
        if self.department == target_dept:
            self.salary = new_salary

    def display(self):
        print(f"{self.name} {self.emp_id} {self.department} {self.salary}")

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    idx = 1
    employees = []
    for _ in range(n):
        name = tokens[idx]
        emp_id = tokens[idx + 1]
        dept = tokens[idx + 2]
        sal = int(tokens[idx + 3])
        employees.append(Employee(name, emp_id, dept, sal))
        idx += 4
    
    target_dept = tokens[idx]
    new_sal = int(tokens[idx + 1])
    
    for emp in employees:
        emp.update_salary(target_dept, new_sal)
        emp.display()

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '3\nAlice 101 HR 30000\nBob 102 IT 50000\nCharlie 103 IT 45000\nIT\n55000', expectedOutput: 'Alice 101 HR 30000\nBob 102 IT 55000\nCharlie 103 IT 55000', isHidden: false },
            { name: 'Case 2 (HR Update)', input: '2\nJohn 201 Finance 40000\nSarah 202 HR 35000\nHR\n45000', expectedOutput: 'John 201 Finance 40000\nSarah 202 HR 45000', isHidden: false },
            { name: 'Case 3 (No Match)', input: '2\nAlex 301 Sales 25000\nBen 302 Marketing 28000\nIT\n60000', expectedOutput: 'Alex 301 Sales 25000\nBen 302 Marketing 28000', isHidden: true }
        ]
    },
    {
        labNumber: 13,
        title: 'Complex Number Addition',
        slug: 'plc6-complex-number-addition',
        programNumber: 13,
        shortObjective: 'Create a Complex class and overload the + operator using __add__().',
        description: `Create a Python class called \`Complex\` containing real and imaginary components.

Implement operator overloading using the \`__add__()\` magic method to add two complex numbers using the \`+\` operator.`,
        inputFormat: `Two lines, each containing the real and imaginary parts of a complex number:
\`\`\`
real1 imaginary1
real2 imaginary2
\`\`\``,
        outputFormat: `Print the addition result in the format:
\`\`\`
Result: <real> + <imaginary>i
\`\`\`
(or \`Result: <real> - <imaginary>i\` if imaginary part is negative)`,
        constraints: [
            'Real and imaginary components are integers or real numbers.'
        ],
        examples: [
            {
                input: '2 3\n4 5',
                output: 'Result: 6 + 8i',
                explanation: '(2 + 3i) + (4 + 5i) = 6 + 8i'
            },
            {
                input: '-2 5\n3 -1',
                output: 'Result: 1 + 4i',
                explanation: '(-2 + 5i) + (3 - 1i) = 1 + 4i'
            }
        ],
        quiz: {
            question: 'What is (2 + 3i) + (4 + 5i)?',
            input: '2 3\n4 5',
            expectedOutput: 'Result: 6 + 8i',
            options: [
                'Result: 6 + 8i',
                'Result: 8 + 6i',
                'Result: 6 - 8i',
                'Result: 5 + 7i'
            ],
            explanation: 'Real parts: 2+4=6, Imaginary parts: 3+5=8 => 6 + 8i'
        },
        difficulty: 'Medium',
        concepts: ['Operator Overloading', '__add__() Magic Method', 'OOP in Python'],
        hints: [
            'Define class Complex with __init__(self, real, imag).',
            'Implement def __add__(self, other): return Complex(self.real + other.real, self.imag + other.imag).',
            'Format output according to the sign of imaginary part.'
        ],
        starterCode: `import sys

class Complex:
    def __init__(self, real, imag):
        self.real = real
        self.imag = imag

    def __add__(self, other):
        return Complex(self.real + other.real, self.imag + other.imag)

    def __str__(self):
        if self.imag >= 0:
            return f"Result: {self.real} + {self.imag}i"
        else:
            return f"Result: {self.real} - {abs(self.imag)}i"

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 4:
        return
    r1, i1, r2, i2 = map(int, tokens[:4])
    c1 = Complex(r1, i1)
    c2 = Complex(r2, i2)
    c3 = c1 + c2
    print(c3)

if __name__ == '__main__':
    solve()`,
        solutionCode: `import sys

class Complex:
    def __init__(self, real, imag):
        self.real = real
        self.imag = imag

    def __add__(self, other):
        return Complex(self.real + other.real, self.imag + other.imag)

    def __str__(self):
        if self.imag >= 0:
            return f"Result: {self.real} + {self.imag}i"
        else:
            return f"Result: {self.real} - {abs(self.imag)}i"

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 4:
        return
    r1, i1, r2, i2 = map(int, tokens[:4])
    c1 = Complex(r1, i1)
    c2 = Complex(r2, i2)
    c3 = c1 + c2
    print(c3)

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '2 3\n4 5', expectedOutput: 'Result: 6 + 8i', isHidden: false },
            { name: 'Sample Case 2', input: '-2 5\n3 -1', expectedOutput: 'Result: 1 + 4i', isHidden: false },
            { name: 'Case 3', input: '0 0\n5 7', expectedOutput: 'Result: 5 + 7i', isHidden: false },
            { name: 'Case 4 (Cancelling)', input: '10 -5\n-10 5', expectedOutput: 'Result: 0 + 0i', isHidden: true }
        ]
    },
    {
        labNumber: 14,
        title: 'Shape Inheritance',
        slug: 'plc6-shape-inheritance',
        programNumber: 14,
        shortObjective: 'Demonstrate inheritance by calculating areas of Triangle, Circle, and Rectangle.',
        description: `Demonstrate inheritance and polymorphism by calculating the areas of a Triangle, Circle, and Rectangle.

Create a base class \`Shape\`, and three derived classes:
- \`Triangle\` (with base and height, $\\text{Area} = 0.5 \\times \\text{base} \\times \\text{height}$)
- \`Circle\` (with radius, $\\text{Area} = \\pi \\times r^2$, using $\\pi = 3.141592653589793$)
- \`Rectangle\` (with length and width, $\\text{Area} = \\text{length} \\times \\text{width}$)

Each derived class implements its own \`area()\` method.`,
        inputFormat: `Line 1: \`base height\` of Triangle
Line 2: \`radius\` of Circle
Line 3: \`length width\` of Rectangle
\`\`\`
base height
radius
length width
\`\`\``,
        outputFormat: `\`\`\`
Triangle Area: <area to 2 decimal places>
Circle Area: <area to 2 decimal places>
Rectangle Area: <area to 2 decimal places>
\`\`\``,
        constraints: [
            'All dimensions are positive real numbers.'
        ],
        examples: [
            {
                input: '10 5\n7\n10 5',
                output: 'Triangle Area: 25.00\nCircle Area: 153.94\nRectangle Area: 50.00',
                explanation: 'Triangle = 0.5*10*5 = 25.00, Circle = pi*7*7 = 153.94, Rectangle = 10*5 = 50.00'
            }
        ],
        quiz: {
            question: 'What is the area of a rectangle with length 10 and width 5?',
            input: '10 5\n7\n10 5',
            expectedOutput: 'Triangle Area: 25.00\nCircle Area: 153.94\nRectangle Area: 50.00',
            options: [
                'Triangle Area: 25.00\nCircle Area: 153.94\nRectangle Area: 50.00',
                'Triangle Area: 50.00\nCircle Area: 153.94\nRectangle Area: 25.00',
                'Triangle Area: 25.00\nCircle Area: 154.00\nRectangle Area: 50.00',
                'Triangle Area: 12.50\nCircle Area: 153.94\nRectangle Area: 50.00'
            ],
            explanation: 'Rectangle area = 10 * 5 = 50.00.'
        },
        difficulty: 'Medium',
        concepts: ['Class Inheritance', 'Polymorphism', 'Method Overriding'],
        hints: [
            'Base class Shape with area() returning 0.',
            'Triangle inherits Shape, area = 0.5 * base * height.',
            'Circle inherits Shape, area = math.pi * radius ** 2.',
            'Rectangle inherits Shape, area = length * width.'
        ],
        starterCode: `import math
import sys

class Shape:
    def area(self):
        return 0.0

class Triangle(Shape):
    def __init__(self, base, height):
        self.base = base
        self.height = height

    def area(self):
        return 0.5 * self.base * self.height

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * (self.radius ** 2)

class Rectangle(Shape):
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        return self.length * self.width

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 5:
        return
    t_base, t_height = float(tokens[0]), float(tokens[1])
    c_radius = float(tokens[2])
    r_len, r_wid = float(tokens[3]), float(tokens[4])
    
    t = Triangle(t_base, t_height)
    c = Circle(c_radius)
    r = Rectangle(r_len, r_wid)
    
    print(f"Triangle Area: {t.area():.2f}")
    print(f"Circle Area: {c.area():.2f}")
    print(f"Rectangle Area: {r.area():.2f}")

if __name__ == '__main__':
    solve()`,
        solutionCode: `import math
import sys

class Shape:
    def area(self):
        return 0.0

class Triangle(Shape):
    def __init__(self, base, height):
        self.base = base
        self.height = height

    def area(self):
        return 0.5 * self.base * self.height

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * (self.radius ** 2)

class Rectangle(Shape):
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        return self.length * self.width

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 5:
        return
    t_base, t_height = float(tokens[0]), float(tokens[1])
    c_radius = float(tokens[2])
    r_len, r_wid = float(tokens[3]), float(tokens[4])
    
    t = Triangle(t_base, t_height)
    c = Circle(c_radius)
    r = Rectangle(r_len, r_wid)
    
    print(f"Triangle Area: {t.area():.2f}")
    print(f"Circle Area: {c.area():.2f}")
    print(f"Rectangle Area: {r.area():.2f}")

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '10 5\n7\n10 5', expectedOutput: 'Triangle Area: 25.00\nCircle Area: 153.94\nRectangle Area: 50.00', isHidden: false },
            { name: 'Case 2', input: '6 4\n3.5\n4 8', expectedOutput: 'Triangle Area: 12.00\nCircle Area: 38.48\nRectangle Area: 32.00', isHidden: false },
            { name: 'Case 3', input: '8 5\n10\n12 6', expectedOutput: 'Triangle Area: 20.00\nCircle Area: 314.16\nRectangle Area: 72.00', isHidden: true }
        ]
    },
    {
        labNumber: 15,
        title: 'File Operations',
        slug: 'plc6-file-operations',
        programNumber: 15,
        shortObjective: 'Perform file operations: display N lines, copy file, display reversed.',
        description: `Write a Python program to perform basic file operations:
1. Accept input text lines and write them to a source file \`sample.txt\`.
2. Display the first \`N\` lines of \`sample.txt\`.
3. Copy the contents of \`sample.txt\` to \`copy.txt\`.
4. Display the lines of \`copy.txt\` in reverse order.`,
        inputFormat: `Line 1: \`N\` (number of lines to display)
Line 2: \`M\` (total number of lines in the file)
Next \`M\` lines: Content lines
\`\`\`
N
M
Line 1
Line 2
...
Line M
\`\`\``,
        outputFormat: `\`\`\`
First <N> lines:
<line 1>
<line 2>
...
Copied file in reverse:
<last line>
...
<first line>
\`\`\``,
        constraints: [
            '1 <= N <= M <= 1000'
        ],
        examples: [
            {
                input: '2\n4\nLine 1\nLine 2\nLine 3\nLine 4',
                output: 'First 2 lines:\nLine 1\nLine 2\nCopied file in reverse:\nLine 4\nLine 3\nLine 2\nLine 1',
                explanation: 'Displays the first 2 lines, copies the file, and prints the 4 lines in reverse order.'
            }
        ],
        quiz: {
            question: 'If the copied file contains lines ["ABC", "DEF"], what will its reversed output be?',
            input: '1\n2\nABC\nDEF',
            expectedOutput: 'First 1 lines:\nABC\nCopied file in reverse:\nDEF\nABC',
            options: [
                'First 1 lines:\nABC\nCopied file in reverse:\nDEF\nABC',
                'First 1 lines:\nABC\nCopied file in reverse:\nABC\nDEF',
                'First 1 lines:\nDEF\nCopied file in reverse:\nDEF\nABC',
                'First 1 lines:\nABC\nCopied file in reverse:\nCBA\nFED'
            ],
            explanation: 'Reversed order of lines is DEF then ABC.'
        },
        difficulty: 'Medium',
        concepts: ['File I/O', 'Reading & Writing Files', 'List Reversal'],
        hints: [
            'Write the input lines to sample.txt.',
            'Read lines using f.readlines() and slice [:n] to print the first N lines.',
            'Write lines to copy.txt.',
            'Read copy.txt and print lines in reverse using lines[::-1].'
        ],
        starterCode: `import sys

def perform_file_ops():
    lines = [line.rstrip('\\r\\n') for line in sys.stdin]
    if not lines:
        return
    n = int(lines[0])
    m = int(lines[1])
    content = lines[2:2+m]
    
    # 1. Write to sample.txt
    with open('sample.txt', 'w') as f:
        for line in content:
            f.write(line + '\\n')
            
    # 2. Read first N lines
    with open('sample.txt', 'r') as f:
        sample_lines = [l.rstrip('\\r\\n') for l in f.readlines()]
        
    print(f"First {n} lines:")
    for line in sample_lines[:n]:
        print(line)
        
    # 3. Copy to copy.txt
    with open('sample.txt', 'r') as src, open('copy.txt', 'w') as dst:
        dst.write(src.read())
        
    # 4. Display copied file in reverse order
    with open('copy.txt', 'r') as f:
        copy_lines = [l.rstrip('\\r\\n') for l in f.readlines()]
        
    print("Copied file in reverse:")
    for line in reversed(copy_lines):
        print(line)

if __name__ == '__main__':
    perform_file_ops()`,
        solutionCode: `import sys

def perform_file_ops():
    lines = [line.rstrip('\\r\\n') for line in sys.stdin]
    if not lines:
        return
    n = int(lines[0])
    m = int(lines[1])
    content = lines[2:2+m]
    
    with open('sample.txt', 'w') as f:
        for line in content:
            f.write(line + '\\n')
            
    with open('sample.txt', 'r') as f:
        sample_lines = [l.rstrip('\\r\\n') for l in f.readlines()]
        
    print(f"First {n} lines:")
    for line in sample_lines[:n]:
        print(line)
        
    with open('sample.txt', 'r') as src, open('copy.txt', 'w') as dst:
        dst.write(src.read())
        
    with open('copy.txt', 'r') as f:
        copy_lines = [l.rstrip('\\r\\n') for l in f.readlines()]
        
    print("Copied file in reverse:")
    for line in reversed(copy_lines):
        print(line)

if __name__ == '__main__':
    perform_file_ops()`,
        testCases: [
            { name: 'Sample Case 1', input: '2\n4\nLine 1\nLine 2\nLine 3\nLine 4', expectedOutput: 'First 2 lines:\nLine 1\nLine 2\nCopied file in reverse:\nLine 4\nLine 3\nLine 2\nLine 1', isHidden: false },
            { name: 'Case 2', input: '1\n2\nABC\nDEF', expectedOutput: 'First 1 lines:\nABC\nCopied file in reverse:\nDEF\nABC', isHidden: false },
            { name: 'Case 3 (3 Lines)', input: '3\n3\nPython\nJava\nC++', expectedOutput: 'First 3 lines:\nPython\nJava\nC++\nCopied file in reverse:\nC++\nJava\nPython', isHidden: true }
        ]
    },
    {
        labNumber: 16,
        title: 'Random Quiz Files',
        slug: 'plc6-random-quiz-files',
        programNumber: 16,
        shortObjective: 'Generate random quiz files along with a corresponding answer-key file.',
        description: `Develop a Python program that generates quiz files containing 10 questions per set and a corresponding \`key_answer\` file.

The program creates:
- \`quiz_<number>.txt\`
- \`key_answer_<number>.txt\`

Each quiz file contains exactly 10 questions, and the answer-key file contains the corresponding 10 answers.`,
        inputFormat: `An integer \`K\` representing the number of quiz sets to generate:
\`\`\`
K
\`\`\``,
        outputFormat: `For each quiz set:
\`\`\`
Generated quiz_<set>.txt and key_answer_<set>.txt
...
Quiz generation completed: <K> sets
\`\`\``,
        constraints: [
            '1 <= K <= 20'
        ],
        examples: [
            {
                input: '1',
                output: 'Generated quiz_1.txt and key_answer_1.txt\nQuiz generation completed: 1 sets',
                explanation: 'Generates quiz_1.txt with 10 questions and key_answer_1.txt with 10 answers.'
            }
        ],
        quiz: {
            question: 'If a quiz contains 10 questions, how many answers should the corresponding key file contain?',
            input: '1',
            expectedOutput: 'Generated quiz_1.txt and key_answer_1.txt\nQuiz generation completed: 1 sets',
            options: [
                'Generated quiz_1.txt and key_answer_1.txt\nQuiz generation completed: 1 sets',
                'Generated quiz_1.txt and key_answer_1.txt\nQuiz generation completed: 10 sets',
                'Generated quiz_1.txt with 5 answers\nQuiz generation completed: 1 sets',
                'Invalid quiz generation'
            ],
            explanation: 'Exactly 10 answers matching the 10 questions.'
        },
        difficulty: 'Medium',
        concepts: ['Random Module', 'File Handling', 'Quiz Generation'],
        hints: [
            'Use random.sample() or random.shuffle() to randomize questions.',
            'For each set k from 1 to K, open quiz_k.txt and key_answer_k.txt.',
            'Write 10 questions and 10 matching answer keys.'
        ],
        starterCode: `import random
import sys

QUESTION_BANK = [
    ("What is the capital of France?", "Paris"),
    ("What is 5 + 7?", "12"),
    ("Which keyword defines a function in Python?", "def"),
    ("What is the boolean opposite of True?", "False"),
    ("What is 2 ** 3 in Python?", "8"),
    ("Which data type is immutable: list or tuple?", "tuple"),
    ("What function returns the length of a string?", "len"),
    ("What symbol is used for comments in Python?", "#"),
    ("What is the output of bool(0)?", "False"),
    ("Which module provides math functions in Python?", "math"),
    ("What method adds an item to the end of a list?", "append"),
    ("What is the index of the first element in Python?", "0")
]

def generate_quizzes(k):
    random.seed(42)  # Seed for deterministic judge verification
    for set_num in range(1, k + 1):
        selected = random.sample(QUESTION_BANK, 10)
        
        quiz_file = f"quiz_{set_num}.txt"
        key_file = f"key_answer_{set_num}.txt"
        
        with open(quiz_file, "w") as qf:
            qf.write(f"Quiz Set {set_num}\\n\\n")
            for idx, (q, _) in enumerate(selected, 1):
                qf.write(f"Question {idx}: {q}\\n")
                
        with open(key_file, "w") as kf:
            kf.write(f"Answer Key Set {set_num}\\n\\n")
            for idx, (_, a) in enumerate(selected, 1):
                kf.write(f"Answer {idx}: {a}\\n")
                
        print(f"Generated {quiz_file} and {key_file}")
        
    print(f"Quiz generation completed: {k} sets")

def solve():
    line = sys.stdin.read().strip()
    if not line:
        return
    k = int(line)
    generate_quizzes(k)

if __name__ == '__main__':
    solve()`,
        solutionCode: `import random
import sys

QUESTION_BANK = [
    ("What is the capital of France?", "Paris"),
    ("What is 5 + 7?", "12"),
    ("Which keyword defines a function in Python?", "def"),
    ("What is the boolean opposite of True?", "False"),
    ("What is 2 ** 3 in Python?", "8"),
    ("Which data type is immutable: list or tuple?", "tuple"),
    ("What function returns the length of a string?", "len"),
    ("What symbol is used for comments in Python?", "#"),
    ("What is the output of bool(0)?", "False"),
    ("Which module provides math functions in Python?", "math"),
    ("What method adds an item to the end of a list?", "append"),
    ("What is the index of the first element in Python?", "0")
]

def generate_quizzes(k):
    random.seed(42)
    for set_num in range(1, k + 1):
        selected = random.sample(QUESTION_BANK, 10)
        
        quiz_file = f"quiz_{set_num}.txt"
        key_file = f"key_answer_{set_num}.txt"
        
        with open(quiz_file, "w") as qf:
            qf.write(f"Quiz Set {set_num}\\n\\n")
            for idx, (q, _) in enumerate(selected, 1):
                qf.write(f"Question {idx}: {q}\\n")
                
        with open(key_file, "w") as kf:
            kf.write(f"Answer Key Set {set_num}\\n\\n")
            for idx, (_, a) in enumerate(selected, 1):
                kf.write(f"Answer {idx}: {a}\\n")
                
        print(f"Generated {quiz_file} and {key_file}")
        
    print(f"Quiz generation completed: {k} sets")

def solve():
    line = sys.stdin.read().strip()
    if not line:
        return
    k = int(line)
    generate_quizzes(k)

if __name__ == '__main__':
    solve()`,
        testCases: [
            { name: 'Sample Case 1', input: '1', expectedOutput: 'Generated quiz_1.txt and key_answer_1.txt\nQuiz generation completed: 1 sets', isHidden: false },
            { name: 'Case 2 (2 Sets)', input: '2', expectedOutput: 'Generated quiz_1.txt and key_answer_1.txt\nGenerated quiz_2.txt and key_answer_2.txt\nQuiz generation completed: 2 sets', isHidden: false },
            { name: 'Case 3 (3 Sets)', input: '3', expectedOutput: 'Generated quiz_1.txt and key_answer_1.txt\nGenerated quiz_2.txt and key_answer_2.txt\nGenerated quiz_3.txt and key_answer_3.txt\nQuiz generation completed: 3 sets', isHidden: true }
        ]
    }
];

async function seedPythonLab() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/askursenior');
        console.log('Connected to MongoDB. Starting Python Programming Lab seeding...');

        // 1. Ensure Python Language exists in PlaygroundLanguage
        let pythonLang = await PlaygroundLanguage.findOne({
            $or: [{ slug: 'plc6' }, { courseCode: 'PLC6' }, { name: /python/i }]
        });

        if (!pythonLang) {
            pythonLang = await PlaygroundLanguage.create({
                name: 'Python Programming Lab',
                slug: 'plc6',
                fullName: 'Python Programming Lab (PLC6)',
                identifier: 'python',
                version: 'Python 3.11',
                fileExtension: '.py',
                accentColor: '#34D399',
                borderColor: 'rgba(52, 211, 153, 0.4)',
                bgGlow: 'rgba(52, 211, 153, 0.12)',
                badge: 'PLC6',
                courseCode: 'PLC6',
                displayOrder: 3,
                isActive: true
            });
            console.log('Created PlaygroundLanguage: Python Programming Lab (PLC6)');
        } else {
            pythonLang.name = 'Python Programming Lab';
            pythonLang.slug = 'plc6';
            pythonLang.courseCode = 'PLC6';
            pythonLang.badge = 'PLC6';
            pythonLang.identifier = 'python';
            pythonLang.fileExtension = '.py';
            pythonLang.version = 'Python 3.11';
            pythonLang.accentColor = '#34D399';
            pythonLang.borderColor = 'rgba(52, 211, 153, 0.4)';
            pythonLang.bgGlow = 'rgba(52, 211, 153, 0.12)';
            pythonLang.isActive = true;
            await pythonLang.save();
            console.log('Updated existing PlaygroundLanguage for Python (PLC6)');
        }

        // 2. Clean up any previous PLC6 labs & problems to ensure clean state
        const existingLabs = await PlaygroundLab.find({ courseCode: 'PLC6' });
        const existingLabIds = existingLabs.map(l => l._id);
        const existingProbs = await PlaygroundProblem.find({ labId: { $in: existingLabIds } });
        const existingProbIds = existingProbs.map(p => p._id);

        if (existingProbIds.length > 0) {
            await PlaygroundTestCase.deleteMany({ problemId: { $in: existingProbIds } });
            await PlaygroundProblemLanguage.deleteMany({ problemId: { $in: existingProbIds } });
            await PlaygroundProblem.deleteMany({ _id: { $in: existingProbIds } });
        }
        await PlaygroundLab.deleteMany({ courseCode: 'PLC6' });
        console.log('Cleaned up previous PLC6 records.');

        // 3. Seed 16 Labs, 16 Problems, ProblemLanguages, and TestCases
        for (let i = 0; i < PYTHON_PROBLEMS.length; i++) {
            const item = PYTHON_PROBLEMS[i];
            const labNumber = item.labNumber;

            // Create Lab Set
            const lab = await PlaygroundLab.create({
                subjectId: pythonLang._id,
                subjectName: 'Python Programming Lab',
                courseCode: 'PLC6',
                labNumber: labNumber,
                title: `Lab Set ${labNumber}`,
                slug: `plc6-lab-set-${labNumber}`,
                description: `Python Programming Lab ${labNumber}: ${item.title}`,
                displayOrder: labNumber,
                isActive: true
            });

            // Create Problem
            const problem = await PlaygroundProblem.create({
                labId: lab._id,
                title: item.title,
                slug: item.slug,
                programNumber: item.programNumber,
                shortObjective: item.shortObjective,
                description: item.description,
                inputFormat: item.inputFormat,
                outputFormat: item.outputFormat,
                constraints: item.constraints,
                examples: item.examples,
                quiz: item.quiz,
                difficulty: item.difficulty,
                concepts: item.concepts,
                hints: item.hints,
                displayOrder: item.programNumber,
                isActive: true
            });

            // Create ProblemLanguage Config for Python
            await PlaygroundProblemLanguage.create({
                problemId: problem._id,
                languageId: pythonLang._id,
                languageSlug: 'python',
                starterCode: item.starterCode,
                solutionCode: item.solutionCode,
                functionSignature: 'def solve():',
                isActive: true
            });

            // Create Test Cases
            const testCaseDocs = item.testCases.map((tc, tcIdx) => ({
                problemId: problem._id,
                name: tc.name || `Case ${tcIdx + 1}`,
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: !!tc.isHidden,
                displayOrder: tcIdx + 1
            }));

            await PlaygroundTestCase.insertMany(testCaseDocs);
            console.log(`✓ Seeded Lab ${labNumber}: "${item.title}" with ${testCaseDocs.length} test cases.`);
        }

        console.log('\n=========================================');
        console.log('Successfully seeded all 16 Python Programming Lab problems!');
        console.log('=========================================\n');
        process.exit(0);
    } catch (err) {
        console.error('Failed to seed Python Lab:', err);
        process.exit(1);
    }
}

seedPythonLab();
