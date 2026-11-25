import type { Locale } from './config';

export interface UiStrings {
  readonly skipToContent: string;
  readonly navLabel: string;
  readonly sections: {
    readonly summary: string;
    readonly experience: string;
    readonly projects: string;
    readonly skills: string;
    readonly education: string;
    readonly languages: string;
    readonly certifications: string;
    readonly publications: string;
    readonly talks: string;
    readonly openSource: string;
  };
  readonly actions: {
    readonly print: string;
    readonly downloadPdf: string;
    readonly toggleThemeToDark: string;
    readonly toggleThemeToLight: string;
    readonly themeShortDark: string;
    readonly themeShortLight: string;
    readonly copyPrefix: string;
    readonly copied: string;
    readonly copyFailed: string;
    readonly switchLanguage: string;
  };
  readonly labels: {
    readonly email: string;
    readonly phone: string;
    readonly github: string;
    readonly linkedin: string;
    readonly website: string;
    readonly repository: string;
    readonly liveDemo: string;
    readonly demoAccount: string;
    readonly demoUsername: string;
    readonly demoPassword: string;
    readonly reference: string;
    readonly gpa: string;
    readonly lastUpdated: string;
    readonly builtWith: string;
    readonly canonicalNotice: string;
    readonly skillFilterHint: string;
  };
  readonly filter: {
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly tagGroupLabel: string;
    readonly allSkills: string;
    readonly clearFilters: string;
    readonly showingCount: string;
    readonly emptyTitle: string;
    readonly emptyAction: string;
  };
}

export const UI: Record<Locale, UiStrings> = {
  en: {
    skipToContent: 'Skip to main content',
    navLabel: 'CV navigation and display utilities',
    sections: {
      summary: 'Summary',
      experience: 'Experience',
      projects: 'Selected Projects',
      skills: 'Technical Skills',
      education: 'Education',
      languages: 'Languages',
      certifications: 'Certifications',
      publications: 'Publications',
      talks: 'Talks',
      openSource: 'Open Source',
    },
    actions: {
      print: 'Print',
      downloadPdf: 'PDF',
      toggleThemeToDark: 'Switch to dark theme',
      toggleThemeToLight: 'Switch to light theme',
      themeShortDark: 'Dark',
      themeShortLight: 'Light',
      copyPrefix: 'Copy',
      copied: 'Copied',
      copyFailed: 'Copy unavailable',
      switchLanguage: 'Language switcher',
    },
    labels: {
      email: 'Email',
      phone: 'Tel',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      website: 'Website',
      repository: 'Repository',
      liveDemo: 'Live',
      demoAccount: 'Demo account',
      demoUsername: 'User',
      demoPassword: 'Pass',
      reference: 'Reference',
      gpa: 'GPA',
      lastUpdated: 'Updated',
      builtWith: 'Static site generated with Astro',
      canonicalNotice: 'Canonical CV',
      skillFilterHint: 'Select a skill to filter matching projects',
    },
    filter: {
      searchLabel: 'Filter projects by keyword',
      searchPlaceholder: 'Search projects or technologies...',
      tagGroupLabel: 'Filter projects by technology',
      allSkills: 'All',
      clearFilters: 'Clear',
      showingCount: 'Showing {visible} of {total} projects',
      emptyTitle: 'No projects match the current filter.',
      emptyAction: 'Reset filters',
    },
  },
  th: {
    skipToContent: 'ข้ามไปยังเนื้อหาหลัก',
    navLabel: 'เมนูนำทางและตัวเลือกการแสดงผลเรซูเม่',
    sections: {
      summary: 'สรุปประวัติย่อ',
      experience: 'ประสบการณ์ทำงาน',
      projects: 'โครงงานที่คัดสรร',
      skills: 'ทักษะทางเทคนิค',
      education: 'การศึกษา',
      languages: 'ภาษา',
      certifications: 'ใบรับรองและคุณวุฒิ',
      publications: 'ผลงานตีพิมพ์',
      talks: 'การบรรยาย',
      openSource: 'โอเพนซอร์ส',
    },
    actions: {
      print: 'พิมพ์',
      downloadPdf: 'PDF',
      toggleThemeToDark: 'สลับเป็นโหมดมืด',
      toggleThemeToLight: 'สลับเป็นโหมดสว่าง',
      themeShortDark: 'มืด',
      themeShortLight: 'สว่าง',
      copyPrefix: 'คัดลอก',
      copied: 'คัดลอกแล้ว',
      copyFailed: 'ไม่สามารถคัดลอกได้',
      switchLanguage: 'สลับภาษา',
    },
    labels: {
      email: 'อีเมล',
      phone: 'โทร',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      website: 'เว็บไซต์',
      repository: 'ซอร์สโค้ด',
      liveDemo: 'เว็บไซต์ใช้งานจริง',
      demoAccount: 'บัญชีทดลองใช้งาน',
      demoUsername: 'ผู้ใช้',
      demoPassword: 'รหัสผ่าน',
      reference: 'อ้างอิง',
      gpa: 'เกรดเฉลี่ย',
      lastUpdated: 'อัปเดตล่าสุด',
      builtWith: 'สร้างแบบ Static Site ด้วย Astro',
      canonicalNotice: 'หน้าหลักเรซูเม่',
      skillFilterHint: 'คลิกทักษะเพื่อกรองโครงงานที่เกี่ยวข้อง',
    },
    filter: {
      searchLabel: 'ค้นหาโครงงานตามคำสำคัญ',
      searchPlaceholder: 'ค้นหาโครงงานหรือเทคโนโลยี...',
      tagGroupLabel: 'กรองโครงงานตามเทคโนโลยี',
      allSkills: 'ทั้งหมด',
      clearFilters: 'ล้างตัวกรอง',
      showingCount: 'แสดง {visible} จาก {total} โครงงาน',
      emptyTitle: 'ไม่พบโครงงานที่ตรงกับเงื่อนไขการค้นหา',
      emptyAction: 'ล้างตัวกรองทั้งหมด',
    },
  },
};
