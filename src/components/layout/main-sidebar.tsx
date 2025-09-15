"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Hand, Mic, MessageSquare, Smile } from "lucide-react";
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
              tooltip="Emotion Detection"
            >
              <a href="/emotion-detection">
                <Smile />
                <span>Emotion Detection</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/sign-language")}
              tooltip="Sign Language"
            >
              <a href="/sign-language">
                <Hand />
                <span>Sign Language</span>
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
