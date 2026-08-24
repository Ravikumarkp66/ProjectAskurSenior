#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    long long a, b, c;

    if (!(cin >> a >> b >> c)) {
        return 0;
    }

    cout << "Largest: " << max(a, max(b, c)) << endl;

    return 0;
}
