"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Hand, Mic, Smile, Image } from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "../shared/logo";
import { useEffect, useState } from "react";

export function MainSidebar() {
  const pathname = usePathname();
  const [activePath, setActivePath] = useState<string | null>(null);

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  const isActive = (path: string) => {
    return activePath === path;
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/emotion-detection")}
              tooltip="Emotion Detection (Pose)"
            >
              <a href="/emotion-detection">
                <Smile />
                <span>Emotion Detection (Pose)</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/emotion-detection-image")}
              tooltip="Emotion Detection (Image)"
            >
              <a href="/emotion-detection-image">
                <Image />
                <span>Emotion Detection (Image)</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/sign-language")}
              tooltip="Sign Language (Pose)"
            >
              <a href="/sign-language">
                <Hand />
                <span>Sign Language (Pose)</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/sign-language-image")}
              tooltip="Sign Language (Image)"
            >
              <a href="/sign-language-image">
                <Image />
                <span>Sign Language (Image)</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/voice-recognition")}
              tooltip="Voice Recognition"
            >
              <a href="/voice-recognition">
                <Mic />
                <span>Voice Recognition</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
