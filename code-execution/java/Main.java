import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLong()) return;
        long a = sc.nextLong();
        if (!sc.hasNextLong()) return;
        long b = sc.nextLong();
        if (!sc.hasNextLong()) return;
        long c = sc.nextLong();

        long largest = Math.max(a, Math.max(b, c));
        System.out.println("Largest: " + largest);
    }
}
