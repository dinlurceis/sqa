package com.doan.WEB_TMDT.common.test;

import org.junit.jupiter.api.extension.*;

import java.util.concurrent.atomic.AtomicInteger;

public class TestResultLogger implements TestWatcher, BeforeAllCallback, AfterAllCallback {

    private final AtomicInteger passed = new AtomicInteger();
    private final AtomicInteger failed = new AtomicInteger();

    @Override
    public void beforeAll(ExtensionContext context) {
        System.out.println("\n===== TEST START =====\n");
    }

    @Override
    public void testSuccessful(ExtensionContext context) {
        System.out.println("TRUE  : " + context.getDisplayName());
        passed.incrementAndGet();
    }

    @Override
    public void testFailed(ExtensionContext context, Throwable cause) {
        System.out.println("FALSE : " + context.getDisplayName()
                + " | " + cause.getMessage());
        failed.incrementAndGet();
    }

    @Override
    public void afterAll(ExtensionContext context) {
        System.out.println("\n================ SUMMARY ================");
        System.out.println("passed=" + passed.get() + ", failed=" + failed.get());
    }
}