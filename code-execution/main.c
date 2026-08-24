#include <stdio.h>

int main() {
    long long a, b, c;

    if (scanf("%lld %lld %lld", &a, &b, &c) != 3) {
        return 0;
    }

    long long largest;

    if (a >= b && a >= c) {
        largest = a;
    } else if (b >= c) {
        largest = b;
    } else {
        largest = c;
    }

    printf("Largest: %lld\n", largest);

    return 0;
}
