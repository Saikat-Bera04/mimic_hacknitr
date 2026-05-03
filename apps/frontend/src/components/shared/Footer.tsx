"use client";

import Link from 'next/link';
import { Github, Linkedin, Twitter } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip-card';

const footerLinks = {
    company: [
        { name: 'About Us', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Blog', href: '#' },
    ],
    legal: [
        { name: 'Terms & Conditions', href: '#' },
        { name: 'Privacy Policy', href: '#' },
        { name: 'Cookie Policy', href: '#' },
    ],
    social: [
        { name: 'GitHub', href: '#', icon: Github },
        { name: 'Twitter', href: '#', icon: Twitter },
        { name: 'LinkedIn', href: '#', icon: Linkedin },
    ],
    support: [
        { name: 'FAQ', href: '#' },
        { name: 'Contact Us', href: '#' },
    ]
};

export function Footer() {
    return (
        <footer className="bg-background border-t border-border/50 mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                    {/* Company */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-medium text-foreground">Company</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Legal */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-medium text-foreground">Legal</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Social */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-medium text-foreground">Social</h3>
                        <ul className="space-y-3">
                            {footerLinks.social.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        <link.icon className="h-4 w-4" />
                                        <span>{link.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Support */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-medium text-foreground">Support</h3>
                        <ul className="space-y-3">
                            {footerLinks.support.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/50 gap-4">
                    <div className="flex items-center gap-2">
                            <Tooltip
                                containerClassName="inline-flex"
                                content={
                                    <div className="max-w-[220px] space-y-2">
                                        <p className="text-sm font-semibold text-neutral-100">Mimic</p>
                                        <p className="text-xs text-neutral-300 leading-relaxed">
                                            A private avatar workspace for training memory, personality, and conversation style.
                                        </p>
                                    </div>
                                }
                            >
                                <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs cursor-help">
                                    M
                                </div>
                            </Tooltip>
                        <span className="text-foreground font-medium text-sm">Mimic</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Mimic. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
