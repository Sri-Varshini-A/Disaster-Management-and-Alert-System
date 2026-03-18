import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;

public class TranslateTest {
    public static void main(String[] args) {
        RestTemplate restTemplate = new RestTemplate();
        ObjectMapper objectMapper = new ObjectMapper();
        String text = "दట్టమైన"; // Telugu/Hindi mixed test string
        try {
            String encodedText = java.net.URLEncoder.encode(text, StandardCharsets.UTF_8.toString());
            java.net.URI uri = new java.net.URI(
                    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q="
                            + encodedText);

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            HttpEntity<String> entity = new HttpEntity<>("parameters", headers);

            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);
            String json = response.getBody();

            System.out.println("Response: " + json);

            if (json != null) {
                JsonNode rootNode = objectMapper.readTree(json);
                if (rootNode.isArray() && rootNode.has(0)) {
                    JsonNode sentences = rootNode.get(0);
                    StringBuilder translatedText = new StringBuilder();
                    for (JsonNode node : sentences) {
                        if (node.has(0) && !node.get(0).isNull()) {
                            translatedText.append(node.get(0).asText());
                        }
                    }
                    if (translatedText.length() > 0) {
                        System.out.println("Translated: " + translatedText.toString().trim());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error translating text: " + e.getMessage());
        }
    }
}
