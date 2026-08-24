import sys

def main():
    data = sys.stdin.read().split()
    if not data:
        return
    a, b, c = map(int, data[:3])
    largest = max(a, b, c)
    print(f"Largest: {largest}")

if __name__ == "__main__":
    main()
