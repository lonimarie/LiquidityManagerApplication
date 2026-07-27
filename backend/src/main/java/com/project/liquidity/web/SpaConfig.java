package com.project.liquidity.web;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Serves the built React bundle when one is present on the classpath, which is how the hosted
 * build runs as a single deployable instead of a separate nginx container.
 */
@Configuration
public class SpaConfig implements WebMvcConfigurer {

    private static final String STATIC_ROOT = "classpath:/static/";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/assets/**")
                .addResourceLocations(STATIC_ROOT + "assets/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).immutable());

        registry.addResourceHandler("/**")
                .addResourceLocations(STATIC_ROOT)
                .setCacheControl(CacheControl.noCache())
                .resourceChain(true)
                .addResolver(new SpaResourceResolver());
    }

    private static final class SpaResourceResolver extends PathResourceResolver {

        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            Resource requested = location.createRelative(resourcePath);
            if (requested.exists() && requested.isReadable()) {
                return requested;
            }

            if (resourcePath.startsWith("api/") || resourcePath.startsWith("actuator/")) {
                return null;
            }

            Resource index = new ClassPathResource("/static/index.html");
            return index.exists() ? index : null;
        }
    }
}
