package com.gridflow.backend.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.io.Console;
import java.util.Arrays;

/** Interactive local helper used by scripts/provision-admin.ps1. */
public final class AdminPasswordHash {
    private AdminPasswordHash() {}

    public static void main(String[] args) {
        Console console = System.console();
        if (console == null) {
            System.err.println("Run this helper from an interactive PowerShell console.");
            System.exit(2);
        }

        char[] password = console.readPassword("New administrator password: ");
        char[] confirmation = console.readPassword("Confirm password: ");
        try {
            if (password == null || confirmation == null) {
                System.err.println("Password entry was cancelled.");
                return;
            }
            if (password.length < 12 || !Arrays.equals(password, confirmation)) {
                System.err.println("Passwords must match and contain at least 12 characters.");
                return;
            }
            String hash = new BCryptPasswordEncoder(12).encode(new String(password));
            System.out.println(hash);
        } finally {
            if (password != null) Arrays.fill(password, '\0');
            if (confirmation != null) Arrays.fill(confirmation, '\0');
        }
    }
}
