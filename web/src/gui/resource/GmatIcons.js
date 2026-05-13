/**
 * GmatIcons.js — Shared icon definitions for GMAT Web GUI
 *
 * Unicode icons for object types used in tree view and tabs.
 */

export const ICONS = {
  // Assets
  Spacecraft: '\u{1F6F0}',      // 🛰
  Formation: '\u{1F6F8}',       // 🛸
  GroundStation: '\u{1F4E1}',   // 📡

  // Hardware
  ChemicalTank: '\u{1F6E2}',    // 🛢
  ElectricTank: '\u{1F50B}',    // 🔋
  ChemicalThruster: '\u{1F4A5}', // 💥
  ElectricThruster: '\u26A1',   // ⚡
  SolarPowerSystem: '\u2600',   // ☀
  NuclearPowerSystem: '\u2622', // ☢

  // Propagators
  ForceModel: '\u{1F30D}',      // 🌍
  Propagator: '\u2699',         // ⚙

  // Burns
  ImpulsiveBurn: '\u26A1',      // ⚡
  FiniteBurn: '\u{1F525}',      // 🔥

  // Solvers
  DifferentialCorrector: '\u{1F50D}', // 🔍
  VF13ad: '\u{1F4C8}',          // 📈

  // Output
  ReportFile: '\u{1F4C4}',      // 📄
  OrbitView: '\u{1F30F}',       // 🌏
  XYPlot: '\u{1F4C8}',          // 📈
  EphemerisFile: '\u{1F4BE}',   // 💾

  // Variables
  Variable: '\u{1D465}',        // 𝑥
  Array: '\u{1F4CB}',           // 📋
  String: '\u{1F520}',          // 🔠

  // Coordinate Systems
  CoordinateSystem: '\u2316',   // ⌖
  PredefinedCoordSys: '\u2316', // ⌖

  // Celestial Bodies
  CelestialBody: '\u{1F30D}',   // 🌍

  // Other
  FileInterface: '\u{1F50C}',   // 🔌
  EclipseLocator: '\u{1F311}',  // 🌑
  ContactLocator: '\u{1F4E1}',  // 📡
  GmatFunction: '\u{1D453}',    // 𝑓

  // Built-in tabs
  Script: '\u{1F4DD}',          // 📝
  OrbitViewer: '\u{1F30F}',     // 🌏
  Report: '\u{1F4C4}',          // 📄

  // Default
  Default: '\u25CF',            // ●
};

/**
 * Get icon for a given object type
 * @param {string} type - The object type
 * @returns {string} - Unicode icon character
 */
export function getIcon(type) {
  return ICONS[type] || ICONS.Default;
}
