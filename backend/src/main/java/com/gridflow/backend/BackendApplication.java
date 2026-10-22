
package com.gridflow.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(BackendApplication.class);
        app.setDefaultProperties(
                java.util.Map.of(
                        "spring.autoconfigure.exclude",
                        "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration"
                )
        );
        app.run(args);
    }
}
