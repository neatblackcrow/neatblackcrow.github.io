import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const linkSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
});

const experienceSchema = z.object({
  id: z.string().min(1),
  organization: z.string().min(1),
  organizationUrl: z.url().optional(),
  role: z.string().min(1),
  period: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  location: z.string().min(1).optional(),
  highlights: z.array(z.string().min(1)).default([]),
  references: z.array(linkSchema).default([]),
  tags: z.array(z.string().min(1)).default([]),
});

const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  highlights: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  repository: z.url().optional(),
  liveUrl: z.url().optional(),
  links: z.array(linkSchema).default([]),
});

const skillGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
});

const educationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  period: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}$/),
  location: z.string().min(1).optional(),
  honors: z.string().min(1).optional(),
  gpa: z.string().min(1).optional(),
});

const languageSchema = z.object({
  name: z.string().min(1),
  proficiency: z.string().min(1),
  credentials: z.string().min(1).optional(),
});

const optionalEntrySchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  period: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  url: z.url().optional(),
});

const cv = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/cv' }),
  schema: z.object({
    locale: z.enum(['en', 'th']),
    lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    seo: z.object({
      title: z.string().min(1),
      description: z.string().min(20).max(200),
    }),
    profile: z.object({
      name: z.string().min(1),
      headline: z.string().min(1),
      location: z.string().min(1),
      streetAddress: z.string().min(1).optional(),
      email: z.email(),
      phone: z.string().min(5),
      phoneHref: z.string().min(5),
      githubUrl: z.url(),
      githubHandle: z.string().min(1),
      linkedinUrl: z.url().optional(),
      websiteUrl: z.url().optional(),
      shellCommand: z.string().min(1),
      shellHost: z.string().min(1),
    }),
    summary: z.string().min(20),
    experience: z.array(experienceSchema).min(1),
    projects: z.array(projectSchema).min(1),
    skills: z.array(skillGroupSchema).min(1),
    education: z.array(educationSchema).min(1),
    languages: z.array(languageSchema).min(1),
    certifications: z.array(optionalEntrySchema).optional(),
    publications: z.array(optionalEntrySchema).optional(),
    talks: z.array(optionalEntrySchema).optional(),
    openSource: z.array(optionalEntrySchema).optional(),
  }),
});

export const collections = { cv };
