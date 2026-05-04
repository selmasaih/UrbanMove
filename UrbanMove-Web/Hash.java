import org.mindrot.jbcrypt.BCrypt;
public class Hash {
    public static void main(String[] args) {
        System.out.println(BCrypt.hashpw("demo123456", BCrypt.gensalt(12)));
        System.out.println(BCrypt.hashpw("admin123456", BCrypt.gensalt(12)));
    }
}
