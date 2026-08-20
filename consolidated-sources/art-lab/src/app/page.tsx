"use client";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ShaderGallery } from "@/components/ShaderGallery";
import { ObrasGallery } from "@/components/ObrasGallery";
import { Manifesto } from "@/components/Manifesto";
import { Studio } from "@/components/Studio";
import { PaletteGenerator } from "@/components/PaletteGenerator";
import { EcosystemFeed } from "@/components/EcosystemFeed";
import { Testimonials } from "@/components/Testimonials";
import { UserProfile } from "@/components/UserProfile";
import { FAQ } from "@/components/FAQ";
import { LabStats } from "@/components/LabStats";
import { TrendingCreators } from "@/components/TrendingCreators";
import { ProceduralFeed } from "@/components/ProceduralFeed";
import { NodoPanel } from "@/components/NodoPanel";
import { FactoryPanel } from "@/components/FactoryPanel";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { ViewerModal } from "@/components/ViewerModal";
import { CommentsPanel } from "@/components/CommentsPanel";
import { OnboardingTour } from "@/components/OnboardingTour";
import { PresentationMode } from "@/components/PresentationMode";
import { CommandPalette } from "@/components/CommandPalette";
import { Notifications } from "@/components/Notifications";
import { NoiacoreAtmosphere } from "@/components/NoiacoreAtmosphere";
import { NoiacoreCursor } from "@/components/NoiacoreCursor";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

function Divider() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="divider-orn" />
    </div>
  );
}

export default function Home() {
  useKeyboardShortcuts();
  return (
    <div className="relative flex min-h-screen flex-col">
      <NoiacoreAtmosphere />
      <NoiacoreCursor />
      <Navbar />
      <main role="main" className="flex-1">
        <Hero />
        <ShaderGallery />
        <Divider />
        <ObrasGallery />
        <UserProfile />
        <Divider />
        <LabStats />
        <Divider />
        <ProceduralFeed />
        <Divider />
        <TrendingCreators />
        <Manifesto />
        <Divider />
        <NodoPanel />
        <Divider />
        <FactoryPanel />
        <Divider />
        <Studio />
        <PaletteGenerator />
        <Divider />
        <EcosystemFeed />
        <Testimonials />
        <Divider />
        <FAQ />
      </main>
      <Footer />
      {/* Overlays */}
      <AuthModal />
      <ViewerModal />
      <CommentsPanel />
      <OnboardingTour />
      <PresentationMode />
      <CommandPalette />
      <Notifications />
    </div>
  );
}
