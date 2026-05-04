package com.urbanmove.util;

/**
 * IoT Impact Calculator — based on scientific studies.
 * MDPI 2023: CO2 reduction 32-40% with smart parking.
 */
public class IoTCalculator {

    private static final int AVG_TIME_SAVED = 15;       // minutes per reservation
    private static final double CO2_PER_RES = 0.45;     // kg CO2 per reservation
    private static final double FUEL_PER_RES = 0.3;     // liters per reservation
    private static final double FUEL_PRICE_MAD = 14.0;  // MAD per liter
    private static final double TIME_VALUE_MAD = 50.0;  // MAD per hour
    private static final double TREE_CO2_YEAR = 22.0;   // kg CO2 absorbed per tree/year

    public static int co2Saved(int reservations)       { return (int) Math.round(reservations * CO2_PER_RES); }
    public static double fuelSaved(int reservations)   { return Math.round(reservations * FUEL_PER_RES * 10.0) / 10.0; }
    public static int treesEquivalent(int reservations) { return (int) Math.round(co2Saved(reservations) / TREE_CO2_YEAR); }
    public static int timeSavedMin(int reservations)   { return reservations * AVG_TIME_SAVED; }
    public static int timeSavedHours(int reservations)  { return Math.round(timeSavedMin(reservations) / 60); }
    public static int fuelCostSaved(int reservations)  { return (int) Math.round(fuelSaved(reservations) * FUEL_PRICE_MAD); }
    public static int timeCostSaved(int reservations)  { return (int) Math.round((timeSavedMin(reservations) / 60.0) * TIME_VALUE_MAD); }
    public static int totalEconomy(int reservations)   { return fuelCostSaved(reservations) + timeCostSaved(reservations); }
}
