export interface SidebarSectionData {
  id: string;
  title: string;
  content: string | React.ReactNode;
  defaultOpen: boolean;
  links?: SidebarLink[];
}

export interface SidebarLink {
  text: string;
  href: string;
  external?: boolean;
}

export interface TechStackInfo {
  title: string;
  technologies: string[];
  description: string;
  githubUrl: string;
}

export interface EducationalSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  techStack: TechStackInfo;
}

export interface SidebarSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SidebarToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export interface TechStackFooterProps {
  stack: TechStackInfo;
}
