/** Configures the OpenAPI documentation and JWT authorization support. */
package com.swift.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/** Adds the "Authorize" button in Swagger UI so you can paste a JWT and try protected endpoints. */
@Configuration
@OpenAPIDefinition(info = @Info(
        title = "Swift (Global Ledger) API",
        version = "1.0",
        description = "P2P wallet: @swift handle transfers, virtual card controls, idempotent payments."))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
}
