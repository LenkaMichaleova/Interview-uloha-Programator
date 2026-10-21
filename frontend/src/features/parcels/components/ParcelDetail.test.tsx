import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ParcelDetail } from './ParcelDetail';

describe('ParcelDetail', () => {
  it('renders essential parcel fields and formats the area value', () => {
    render(
      <ParcelDetail
        parcelInfo={{
          id: 'parcel-42',
          parcelNumber: '123/45',
          cadastre: 'Jičín',
          area: 15000,
          landUse: 'Zemědělská půda',
          owner: 'A. Novák',
          cadastralArea: 'Jičín',
          status: 'Aktivní',
        }}
      />
    );

    expect(screen.getByText('Jičín')).toBeInTheDocument();
    expect(screen.getByText('123/45')).toBeInTheDocument();
    expect(screen.getByText('Vlastník')).toBeInTheDocument();
    expect(screen.getByText('A. Novák')).toBeInTheDocument();
    expect(screen.getByText('Plocha')).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => {
        return (
          element?.textContent === '15 000 m²' ||
          element?.textContent === '15 000 m²'
        );
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Aktivní')).toBeInTheDocument();
  });
});
