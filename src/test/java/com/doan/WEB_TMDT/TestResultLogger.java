package com.doan.WEB_TMDT;

import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestWatcher;

import java.util.Optional;

public class TestResultLogger implements TestWatcher {

    @Override
    public void testSuccessful(ExtensionContext context) {
        System.out.println(context.getRequiredTestMethod().getName() + " PASS");
    }

    @Override
    public void testFailed(ExtensionContext context, Throwable cause) {
        System.out.println(context.getRequiredTestMethod().getName() + " FAIL");
    }

    @Override
    public void testAborted(ExtensionContext context, Throwable cause) {
        System.out.println(context.getRequiredTestMethod().getName() + " ABORTED");
    }

    @Override
    public void testDisabled(ExtensionContext context, Optional<String> reason) {
        System.out.println(context.getRequiredTestMethod().getName() + " DISABLED");
    }
}
